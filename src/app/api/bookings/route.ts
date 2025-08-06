import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import Service from '@/models/Service'
import SalonInfo from '@/models/SalonInfo'
import notificationService from '@/lib/notifications'

export async function POST(req: NextRequest) {
  await dbConnect()
  
  try {
    const { name, email, phone, serviceId, date, time, notes } = await req.json()
    
    // Validate required fields
    if (!name || !email || !phone || !serviceId || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate date is not in the past
    const bookingDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (bookingDate < today) {
      return NextResponse.json({ error: 'Cannot book for a past date' }, { status: 400 })
    }

    // Get service details
    const service = await Service.findById(serviceId)
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Check if slot is available
    const existingBooking = await Booking.findOne({
      date,
      time,
      status: { $nin: ['cancelled'] }
    })

    if (existingBooking) {
      return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 })
    }

    // Create booking
    const booking = new Booking({
      name,
      email,
      phone,
      serviceId,
      serviceName: service.name,
      date,
      time,
      price: service.price,
      notes,
      status: 'pending',
      paymentStatus: 'pending'
    })

    await booking.save()

    // Get salon information for notifications
    const salonInfo = await SalonInfo.findOne()
    
    // Send notification
    try {
             await notificationService.sendBookingConfirmation({
         to: email,
         name,
         bookingId: booking._id.toString(),
         serviceName: service.name,
         date,
         time,
         price: service.price,
         phone,
         salonName: salonInfo?.name,
         salonPhone: salonInfo?.phone,
         salonAddress: salonInfo?.address
       }, true) // Send both email and SMS
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError)
      // Don't fail the booking if notification fails
    }

    return NextResponse.json(booking, { status: 201 })
  } catch (err: any) {
    console.error('Booking creation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  await dbConnect()
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 })
    return NextResponse.json(bookings)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
