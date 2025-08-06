import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { verifyTokenString } from '@/lib/auth'
import CustomerLoyalty from '@/models/CustomerLoyalty'

export async function GET(req: NextRequest) {
  await dbConnect()

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'customer') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get customer loyalty data
    const loyalty = await CustomerLoyalty.findOne({ customerId: decoded.id })
      .populate('customerId', 'name email')

    if (!loyalty) {
      // Return default loyalty data for new customers
      return NextResponse.json({
        points: 0,
        totalSpent: 0,
        totalBookings: 0,
        tier: 'bronze',
        badges: [],
        milestones: [],
        activeDiscounts: []
      })
    }

    return NextResponse.json(loyalty)

  } catch (error: any) {
    console.error('Error fetching loyalty data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 