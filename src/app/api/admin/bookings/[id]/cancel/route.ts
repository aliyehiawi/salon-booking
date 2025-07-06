// src/app/api/admin/bookings/[id]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import { verifyToken } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  try {
    verifyToken(req)
    const updated = await Booking.findByIdAndUpdate(
      params.id,
      { status: 'cancelled' },
      { new: true }
    )
    return NextResponse.json(updated)
  } catch (err: any) {
    const status = err.message === 'Missing token' ? 401 : 500
    return NextResponse.json({ error: err.message }, { status })
  }
}
