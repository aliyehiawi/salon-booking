import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import Service from '@/models/Service'

export async function GET(req: NextRequest) {
  await dbConnect()
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')

    if (!date || !serviceId) {
      return NextResponse.json({ error: 'Date and serviceId are required' }, { status: 400 })
    }

    // Get the service to determine duration
    const service = await Service.findById(serviceId)
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Extract duration in minutes from the service
    const durationMatch = service.duration.match(/(\d+)/)
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60

    // Get all bookings for the selected date
    const existingBookings = await Booking.find({ date, status: { $ne: 'cancelled' } }).populate('serviceId')

    // Generate all possible time slots from 9 AM to 6 PM
    const startHour = 9
    const endHour = 18
    const slotInterval = 15 // 15-minute intervals
    const allSlots = []

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const ampm = hour < 12 ? 'AM' : 'PM'
        const displayHour = hour % 12 === 0 ? 12 : hour % 12
        const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
        
        allSlots.push({
          time: timeString,
          displayTime,
          available: true
        })
      }
    }

    // Mark slots as unavailable if they conflict with existing bookings
    existingBookings.forEach(booking => {
      const bookingStart = booking.time
      
      // Get the duration of the existing booking's service
      let existingDuration = 60 // default fallback
      
      if (booking.serviceId && booking.serviceId.duration) {
        const durationMatch = booking.serviceId.duration.match(/(\d+)/)
        existingDuration = durationMatch ? parseInt(durationMatch[1]) : 60
      }

      // Mark all slots that overlap with this booking as unavailable
      allSlots.forEach(slot => {
        const slotTime = slot.time
        const slotHour = parseInt(slotTime.split(':')[0])
        const slotMinute = parseInt(slotTime.split(':')[1])
        const slotMinutes = slotHour * 60 + slotMinute

        const bookingHour = parseInt(bookingStart.split(':')[0])
        const bookingMinute = parseInt(bookingStart.split(':')[1])
        const bookingMinutes = bookingHour * 60 + bookingMinute

        // Check if this slot overlaps with the existing booking
        if (slotMinutes >= bookingMinutes && slotMinutes < bookingMinutes + existingDuration) {
          slot.available = false
        }
      })
    })

    // Filter out slots that don't have enough consecutive available time for the service duration
    const availableSlots = allSlots.filter((slot, index) => {
      if (!slot.available) return false

      // Check if we have enough consecutive available slots for the service duration
      const requiredSlots = Math.ceil(durationMinutes / slotInterval)
      let hasEnoughSlots = true

      for (let i = 0; i < requiredSlots; i++) {
        if (index + i >= allSlots.length || !allSlots[index + i].available) {
          hasEnoughSlots = false
          break
        }
      }

      return hasEnoughSlots
    })

    return NextResponse.json({
      slots: availableSlots.map(slot => slot.displayTime),
      duration: durationMinutes
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 