import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { verifyTokenString } from '@/lib/auth'
import Discount from '@/models/Discount'

export async function GET(req: NextRequest) {
  await dbConnect()

  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get all discounts
    const discounts = await Discount.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    return NextResponse.json(discounts)

  } catch (error: any) {
    console.error('Error fetching discounts:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await dbConnect()

  try {
    // Verify admin authentication
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

    // Validate required fields
    if (!data.code || !data.name || !data.discountType || !data.value || !data.validUntil) {
      return NextResponse.json({ 
        error: 'Code, name, discount type, value, and valid until date are required' 
      }, { status: 400 })
    }

    // Validate discount value
    if (data.discountType === 'percentage' && (data.value < 0 || data.value > 100)) {
      return NextResponse.json({ 
        error: 'Percentage discount must be between 0 and 100' 
      }, { status: 400 })
    }

    if (data.discountType === 'fixed' && data.value < 0) {
      return NextResponse.json({ 
        error: 'Fixed discount amount must be positive' 
      }, { status: 400 })
    }

    // Check if code already exists
    const existingDiscount = await Discount.findOne({ code: data.code.toUpperCase() })
    if (existingDiscount) {
      return NextResponse.json({ 
        error: 'Discount code already exists' 
      }, { status: 409 })
    }

    // Create new discount
    const discount = await Discount.create({
      ...data,
      code: data.code.toUpperCase(),
      createdBy: decoded.id
    })

    return NextResponse.json({
      message: 'Discount created successfully',
      discount
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating discount:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 