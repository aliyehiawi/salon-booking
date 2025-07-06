// src/app/api/admin/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  await dbConnect()
  try {
    verifyToken(req)
    const bookings = await Booking.find().sort({ createdAt: -1 })
    return NextResponse.json(bookings)
  } catch (err: any) {
    const status = err.message === 'Missing token' ? 401 : 500
    return NextResponse.json({ error: err.message }, { status })
  }
}
