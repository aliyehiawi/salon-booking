import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'

export async function POST(req: NextRequest) {
  await dbConnect()
  try {
    const data = await req.json()
    
    // Ensure we have both serviceId and serviceName
    if (!data.serviceId || !data.serviceName) {
      return NextResponse.json({ error: 'Service ID and name are required' }, { status: 400 })
    }
    
    const booking = await Booking.create(data)
    return NextResponse.json({ message: 'Booking saved', booking }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
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
