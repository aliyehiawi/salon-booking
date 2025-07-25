import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import Service from '@/models/Service'
import BusinessSettings from '@/models/BusinessSettings'

export async function GET(req: NextRequest) {
  await dbConnect()
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')

    if (!date || !serviceId) {
      return NextResponse.json({ error: 'Date and serviceId are required' }, { status: 400 })
    }

    // Get business settings
    const settings = await BusinessSettings.findOne()
    if (!settings) {
      return NextResponse.json({ error: 'Business settings not found' }, { status: 500 })
    }

    // Check if date is a holiday/closed
    if (settings.holidays.includes(date)) {
      return NextResponse.json({ slots: [], reason: 'Closed for holiday' })
    }

    // Check max bookings per day
    const bookingsCount = await Booking.countDocuments({ date, status: { $ne: 'cancelled' } })
    if (bookingsCount >= settings.maxBookingsPerDay) {
      return NextResponse.json({ slots: [], reason: 'Fully booked for this day' })
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

    // Get business hours for the day
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const hours = settings.businessHours[dayOfWeek]
    if (!hours || !hours.open || !hours.close) {
      return NextResponse.json({ slots: [], reason: 'Closed on this day' })
    }
    const [startHour, startMinute] = hours.open.split(':').map(Number)
    const [endHour, endMinute] = hours.close.split(':').map(Number)
    const slotInterval = 15 // 15-minute intervals
    const allSlots: { time: string; displayTime: string; available: boolean }[] = []

    // Generate all possible time slots within business hours
    let currMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    while (currMinutes + durationMinutes <= endMinutes) {
      const hour = Math.floor(currMinutes / 60)
      const minute = currMinutes % 60
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const ampm = hour < 12 ? 'AM' : 'PM'
      const displayHour = hour % 12 === 0 ? 12 : hour % 12
      const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
      allSlots.push({
        time: timeString,
        displayTime,
        available: true
      })
      currMinutes += slotInterval
    }

    // Mark slots as unavailable if they conflict with existing bookings (add break time after each booking)
    const breakMinutes = settings.breakMinutes || 0
    existingBookings.forEach(booking => {
      const bookingStart = booking.time
      // Get the duration of the existing booking's service
      let existingDuration = 60 // default fallback
      if (booking.serviceId && booking.serviceId.duration) {
        const durationMatch = booking.serviceId.duration.match(/(\d+)/)
        existingDuration = durationMatch ? parseInt(durationMatch[1]) : 60
      }
      // Add break after booking
      const totalBlock = existingDuration + breakMinutes
      allSlots.forEach(slot => {
        const slotTime = slot.time
        const slotHour = parseInt(slotTime.split(':')[0])
        const slotMinute = parseInt(slotTime.split(':')[1])
        const slotMinutes = slotHour * 60 + slotMinute
        const bookingHour = parseInt(bookingStart.split(':')[0])
        const bookingMinute = parseInt(bookingStart.split(':')[1])
        const bookingMinutes = bookingHour * 60 + bookingMinute
        // Block slots that overlap with booking + break
        if (slotMinutes >= bookingMinutes && slotMinutes < bookingMinutes + totalBlock) {
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