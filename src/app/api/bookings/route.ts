import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import BusinessSettings from '@/models/BusinessSettings'

export async function POST(req: NextRequest) {
  await dbConnect()
  try {
    const data = await req.json()

    // Get business settings
    const settings = await BusinessSettings.findOne()
    if (!settings) {
      return NextResponse.json({ error: 'Business settings not found' }, { status: 500 })
    }

    // Ensure we have both serviceId and serviceName
    if (!data.serviceId || !data.serviceName) {
      return NextResponse.json({ error: 'Service ID and name are required' }, { status: 400 })
    }

    // --- Validation ---
    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Phone validation (allow +, digits, 10-15 chars)
    const phoneRegex = /^\+?\d{10,15}$/
    if (!phoneRegex.test(data.phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Date validation (not in the past, valid date)
    const now = new Date()
    const bookingDate = new Date(data.date)
    if (isNaN(bookingDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }
    // Only compare date part (ignore time)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate())
    if (bookingDay < today) {
      return NextResponse.json({ error: 'Cannot book for a past date' }, { status: 400 })
    }

    // Check if date is a holiday/closed
    if (settings.holidays.includes(data.date)) {
      return NextResponse.json({ error: 'Closed for holiday' }, { status: 400 })
    }

    // Check max bookings per day
    const bookingsCount = await Booking.countDocuments({ date: data.date, status: { $ne: 'cancelled' } })
    if (bookingsCount >= settings.maxBookingsPerDay) {
      return NextResponse.json({ error: 'Fully booked for this day' }, { status: 400 })
    }

    // Time validation (use business hours from settings)
    const timeRegex = /^(\d{2}):(\d{2})$/
    const match = data.time.match(timeRegex)
    if (!match) {
      return NextResponse.json({ error: 'Invalid time format' }, { status: 400 })
    }
    const hour = parseInt(match[1], 10)
    const minute = parseInt(match[2], 10)
    // Get business hours for the day
    const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const hours = settings.businessHours[dayOfWeek]
    if (!hours || !hours.open || !hours.close) {
      return NextResponse.json({ error: 'Closed on this day' }, { status: 400 })
    }
    const [startHour, startMinute] = hours.open.split(':').map(Number)
    const [endHour, endMinute] = hours.close.split(':').map(Number)
    const bookingMinutes = hour * 60 + minute
    const openMinutes = startHour * 60 + startMinute
    const closeMinutes = endHour * 60 + endMinute
    if (
      bookingMinutes < openMinutes ||
      bookingMinutes + 1 > closeMinutes || // +1 to ensure booking ends before close
      minute % 15 !== 0
    ) {
      return NextResponse.json({ error: `Time must be within business hours (${hours.open}-${hours.close}) and on a 15-minute interval` }, { status: 400 })
    }

    // Duplicate booking prevention (same service, date, time, and email or phone)
    const duplicate = await Booking.findOne({
      serviceId: data.serviceId,
      date: data.date,
      time: data.time,
      $or: [
        { email: data.email },
        { phone: data.phone }
      ]
    })
    if (duplicate) {
      return NextResponse.json({ error: 'Duplicate booking detected for this slot' }, { status: 409 })
    }

    // Prevent overlapping bookings (with break time)
    const breakMinutes = settings.breakMinutes || 0
    // Assume service duration is in minutes in data.serviceDuration (or fallback to 60)
    const durationMinutes = data.serviceDuration ? parseInt(data.serviceDuration) : 60
    const newBookingStart = bookingMinutes
    const newBookingEnd = bookingMinutes + durationMinutes
    const existingBookings = await Booking.find({ date: data.date, status: { $ne: 'cancelled' } }).populate('serviceId')
    for (const booking of existingBookings) {
      const [bHour, bMinute] = booking.time.split(':').map(Number)
      const bStart = bHour * 60 + bMinute
      let bDuration = 60
      if (booking.serviceId && booking.serviceId.duration) {
        const match = booking.serviceId.duration.match(/(\d+)/)
        bDuration = match ? parseInt(match[1]) : 60
      }
      const bEnd = bStart + bDuration + breakMinutes
      if (
        (newBookingStart >= bStart && newBookingStart < bEnd) ||
        (bStart >= newBookingStart && bStart < newBookingEnd + breakMinutes)
      ) {
        return NextResponse.json({ error: 'Booking overlaps with another appointment or break time' }, { status: 400 })
      }
    }

    const booking = await Booking.create(data)
    return NextResponse.json({ message: 'Booking saved', booking }, { status: 201 })
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 })
  }
}

export async function GET() {
  await dbConnect()
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 })
    return NextResponse.json(bookings)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
