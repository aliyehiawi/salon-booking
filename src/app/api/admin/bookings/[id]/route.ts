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
    const decoded = await verifyTokenString(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { status } = await req.json()
    
    if (!status || !['pending', 'confirmed', 'cancelled', 'postponed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const booking = await Booking.findByIdAndUpdate(
      params.id,
      { status },
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