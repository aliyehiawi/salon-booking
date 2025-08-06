import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Discount from '@/models/Discount'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    
    // Verify customer authentication
    const decoded = verifyToken(req) as { id: string; type: string }
    if (!decoded || decoded.type !== 'customer') {
      return NextResponse.json({ error: 'Customer authentication required' }, { status: 401 })
    }

    const { discountCode, bookingAmount } = await req.json()

    if (!discountCode) {
      return NextResponse.json({ error: 'Discount code is required' }, { status: 400 })
    }

    // Find the discount
    const discount = await Discount.findOne({
      code: discountCode.toUpperCase(),
      isActive: true
    })

    if (!discount) {
      return NextResponse.json({ error: 'Invalid discount code' }, { status: 404 })
    }

    // Check if discount is valid (dates, usage limits, etc.)
    const now = new Date()
    if (discount.validFrom && discount.validFrom > now) {
      return NextResponse.json({ error: 'Discount code is not yet active' }, { status: 400 })
    }

    if (discount.validUntil && discount.validUntil < now) {
      return NextResponse.json({ error: 'Discount code has expired' }, { status: 400 })
    }

    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return NextResponse.json({ error: 'Discount code usage limit reached' }, { status: 400 })
    }

    if (discount.minimumAmount && bookingAmount < discount.minimumAmount) {
      return NextResponse.json({ 
        error: `Minimum order amount of $${discount.minimumAmount} required` 
      }, { status: 400 })
    }

    // Check customer restrictions
    if (discount.customerRestrictions?.newCustomersOnly) {
      // Check if customer has previous bookings
      const Booking = (await import('@/models/Booking')).default
      const customerBookings = await Booking.find({ customerId: decoded.id })
      if (customerBookings.length > 0) {
        return NextResponse.json({ error: 'This discount is only for new customers' }, { status: 400 })
      }
    }

    if (discount.customerRestrictions?.existingCustomersOnly) {
      // Check if customer has previous bookings
      const Booking = (await import('@/models/Booking')).default
      const customerBookings = await Booking.find({ customerId: decoded.id })
      if (customerBookings.length === 0) {
        return NextResponse.json({ error: 'This discount is only for existing customers' }, { status: 400 })
      }
    }

    // Check per-customer usage limit
    if (discount.usageRestrictions?.perCustomerLimit) {
      const customerUsageCount = discount.usageHistory.filter(
        (usage: any) => usage.customerId.toString() === decoded.id
      ).length
      
      if (customerUsageCount >= discount.usageRestrictions.perCustomerLimit) {
        return NextResponse.json({ error: 'You have already used this discount code' }, { status: 400 })
      }
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discount.discountType === 'percentage') {
      discountAmount = (bookingAmount * discount.value) / 100
      if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
        discountAmount = discount.maxDiscount
      }
    } else if (discount.discountType === 'fixed') {
      discountAmount = Math.min(discount.value, bookingAmount)
    }

    return NextResponse.json({
      valid: true,
      discountId: discount._id,
      discountAmount: discountAmount,
      discountType: discount.discountType,
      discountValue: discount.value,
      name: discount.name,
      description: discount.description
    })

  } catch (error) {
    console.error('Error validating discount:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}