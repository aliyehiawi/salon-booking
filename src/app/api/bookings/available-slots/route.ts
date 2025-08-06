import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import Service from '@/models/Service'
import SalonInfo from '@/models/SalonInfo'
import { cacheService, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'

export async function GET(req: NextRequest) {
  await dbConnect()
  
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')

    if (!date || !serviceId) {
      return NextResponse.json({ error: 'Date and serviceId are required' }, { status: 400 })
    }

    // Check cache first
    const cacheKey = CACHE_KEYS.AVAILABLE_SLOTS(date, serviceId)
    const cachedSlots = cacheService.get(cacheKey)
    
    if (cachedSlots) {
      return NextResponse.json({ slots: cachedSlots })
    }

    // Get service details
    const service = await Service.findById(serviceId).lean()
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Get salon business hours
    const salonInfo = await SalonInfo.findOne().lean()
    if (!salonInfo) {
      return NextResponse.json({ error: 'Salon information not found' }, { status: 404 })
    }

    // Get day of week
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' })
    const businessHours = salonInfo.businessHours[dayOfWeek]

    if (!businessHours || businessHours.closed) {
      return NextResponse.json({ slots: [] })
    }

    // Get existing bookings for the date
    const existingBookings = await Booking.find({
      date,
      status: { $nin: ['cancelled'] }
    }).select('time').lean()

    const bookedTimes = new Set(existingBookings.map(booking => booking.time))

    // Generate available time slots
    const slots = []
    const startTime = new Date(`2000-01-01T${businessHours.open}`)
    const endTime = new Date(`2000-01-01T${businessHours.close}`)
    const slotDuration = 15 // minutes

    while (startTime < endTime) {
      const timeString = startTime.toTimeString().slice(0, 5)
      
      if (!bookedTimes.has(timeString)) {
        slots.push(timeString)
      }
      
      startTime.setMinutes(startTime.getMinutes() + slotDuration)
    }

    // Cache the result for 30 seconds
    cacheService.set(cacheKey, slots, CACHE_TTL.AVAILABLE_SLOTS)

    return NextResponse.json({ slots })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 