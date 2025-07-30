// src/app/api/auth/bookings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import { verifyTokenString } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect()
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'customer') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { action, newDate, newTime } = await req.json()

    // Find booking and verify ownership
    const booking = await Booking.findOne({
      _id: params.id,
      $or: [
        { customerId: decoded.id },
        { email: decoded.email }
      ]
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if booking can be modified (not in the past)
    const bookingDate = new Date(booking.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (bookingDate < today) {
      return NextResponse.json({ error: 'Cannot modify past bookings' }, { status: 400 })
    }

    if (action === 'cancel') {
      booking.status = 'cancelled'
      await booking.save()
      return NextResponse.json({ message: 'Booking cancelled successfully' })
    }

    if (action === 'reschedule') {
      if (!newDate || !newTime) {
        return NextResponse.json({ error: 'New date and time are required' }, { status: 400 })
      }

      // Validate new date is not in the past
      const newBookingDate = new Date(newDate)
      if (newBookingDate < today) {
        return NextResponse.json({ error: 'Cannot reschedule to a past date' }, { status: 400 })
      }

      booking.date = newDate
      booking.time = newTime
      booking.status = 'pending' // Reset to pending for admin approval
      await booking.save()
      
      return NextResponse.json({ message: 'Booking rescheduled successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 