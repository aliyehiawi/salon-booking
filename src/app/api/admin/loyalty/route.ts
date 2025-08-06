import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { verifyTokenString } from '@/lib/auth'
import CustomerLoyalty from '@/models/CustomerLoyalty'

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

    // Get all customer loyalty data
    const loyaltyData = await CustomerLoyalty.find()
      .populate('customerId', 'name email')
      .sort({ totalSpent: -1, totalBookings: -1 })

    return NextResponse.json(loyaltyData)

  } catch (error: any) {
    console.error('Error fetching loyalty data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 