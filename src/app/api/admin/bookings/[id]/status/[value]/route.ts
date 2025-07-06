// src/app/api/admin/bookings/[id]/status/[value]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import { verifyToken } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; value: string }> }
) {
  await dbConnect()
  try {
    verifyToken(req)

    // await the dynamic params
    const { id, value } = await params
    const { date } = await req.json()

    const allowed = ['pending', 'confirmed', 'cancelled', 'postponed']
    if (!allowed.includes(value)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }

    const updateFields: Partial<{ status: string; date?: string }> = { status: value }
    if (date) updateFields.date = date

    const updated = await Booking.findByIdAndUpdate(id, updateFields, { new: true })
    return NextResponse.json(updated)
  } catch (err: any) {
    const status = err.message === 'Missing token' ? 401 : 500
    return NextResponse.json({ error: err.message }, { status })
  }
}
