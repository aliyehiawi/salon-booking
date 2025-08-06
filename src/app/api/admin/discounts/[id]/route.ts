import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Discount from '@/models/Discount'
import { verifyTokenString } from '@/lib/auth'

export async function PATCH(
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
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const data = await req.json()
    
    // If code is being updated, check for uniqueness
    if (data.code) {
      const existingDiscount = await Discount.findOne({ 
        code: data.code.toUpperCase(),
        _id: { $ne: params.id }
      })
      if (existingDiscount) {
        return NextResponse.json({ error: 'Discount code already exists' }, { status: 400 })
      }
      data.code = data.code.toUpperCase()
    }

    const discount = await Discount.findByIdAndUpdate(
      params.id,
      data,
      { new: true }
    ).populate('applicableServices', 'name')

    if (!discount) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 })
    }

    return NextResponse.json(discount)
  } catch (err: any) {
    console.error('Error updating discount:', err)
    return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 })
  }
}

export async function DELETE(
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
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const discount = await Discount.findByIdAndDelete(params.id)
    
    if (!discount) {
      return NextResponse.json({ error: 'Discount not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Discount deleted successfully' })
  } catch (err: any) {
    console.error('Error deleting discount:', err)
    return NextResponse.json({ error: 'Failed to delete discount' }, { status: 500 })
  }
} 