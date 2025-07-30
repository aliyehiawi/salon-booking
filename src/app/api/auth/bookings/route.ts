// src/app/api/auth/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import { verifyTokenString } from '@/lib/auth'

export async function GET(req: NextRequest) {
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

    // Get bookings for this customer (both by customerId and email for backward compatibility)
    const bookings = await Booking.find({
      $or: [
        { customerId: decoded.id },
        { email: decoded.email }
      ]
    })
    .populate('serviceId', 'name description duration price')
    .sort({ createdAt: -1 })

    return NextResponse.json(bookings)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 