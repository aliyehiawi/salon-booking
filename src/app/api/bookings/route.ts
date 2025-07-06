// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking     from '@/models/Booking'

// Public: Create a booking
export async function POST(req: NextRequest) {
  await dbConnect()
  try {
    const data = await req.json()
    const booking = await Booking.create(data)
    return NextResponse.json({ message: 'Booking saved', booking }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// (Optional) Public: List bookings — useful for testing
export async function GET() {
  await dbConnect()
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 })
    return NextResponse.json(bookings)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
