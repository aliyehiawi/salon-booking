import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import CustomerLoyalty from '@/models/CustomerLoyalty'
import Customer from '@/models/Customer'
import Booking from '@/models/Booking'
import { verifyTokenString } from '@/lib/auth'

export async function GET(req: NextRequest) {
  await dbConnect()
  
  try {
    // Verify customer token
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'customer') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get customer details
    const customer = await Customer.findById(decoded.id)
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get or create loyalty record
    let loyalty = await CustomerLoyalty.findOne({ customerId: decoded.id })
    
    if (!loyalty) {
      // Calculate initial loyalty data from bookings
      const customerBookings = await Booking.find({ email: customer.email })
      const totalSpent = customerBookings.reduce((sum, booking) => {
        const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
        return sum + price
      }, 0)

      loyalty = new CustomerLoyalty({
        customerId: decoded.id,
        points: Math.floor(totalSpent), // 1 point per dollar spent
        totalSpent,
        totalBookings: customerBookings.length,
        tier: 'bronze',
        badges: [],
        milestones: [],
        activeDiscounts: [],
        lastActivity: customerBookings.length > 0 ? customerBookings[customerBookings.length - 1].createdAt : new Date()
      })

      await loyalty.save()
    }

    // Get customer's recent bookings for additional context
    const recentBookings = await Booking.find({ email: customer.email })
      .sort({ createdAt: -1 })
      .limit(5)

    // Calculate additional loyalty metrics
    const loyaltyData = {
      points: loyalty.points,
      totalSpent: loyalty.totalSpent,
      totalBookings: loyalty.totalBookings,
      tier: loyalty.tier,
      badges: loyalty.badges,
      milestones: loyalty.milestones,
      activeDiscounts: loyalty.activeDiscounts,
      lastActivity: loyalty.lastActivity,
      recentBookings: recentBookings.map(booking => ({
        id: booking._id,
        serviceName: booking.serviceName,
        date: booking.date,
        amount: booking.price,
        status: booking.status
      }))
    }

    return NextResponse.json(loyaltyData)
  } catch (err: any) {
    console.error('Loyalty API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 