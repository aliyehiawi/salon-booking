import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import { verifyTokenString } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect()
  
  try {
    // Verify admin token
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { status, date, time } = await req.json()
    
    // Validate status if provided
    if (status && !['pending', 'confirmed', 'cancelled', 'postponed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Validate date if provided
    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(date)) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
      }
      
      // Check if date is not in the past
      const bookingDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (bookingDate < today) {
        return NextResponse.json({ error: 'Cannot book for a past date' }, { status: 400 })
      }
    }

    // Validate time if provided
    if (time) {
      const timeRegex = /^(\d{2}):(\d{2})$/
      if (!timeRegex.test(time)) {
        return NextResponse.json({ error: 'Invalid time format' }, { status: 400 })
      }
    }

    // Build update object
    const updateData: any = {}
    if (status) updateData.status = status
    if (date) updateData.date = date
    if (time) updateData.time = time

    const booking = await Booking.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    )

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 