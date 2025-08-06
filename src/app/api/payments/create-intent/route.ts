import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { verifyTokenString } from '@/lib/auth'
import { createPaymentIntent, getOrCreateStripeCustomer, calculatePointsEarned } from '@/lib/stripe'
import { PaymentTransaction } from '@/models/Payment'
import Booking from '@/models/Booking'
import Service from '@/models/Service'
import Customer from '@/models/Customer'
import Discount from '@/models/Discount'

export async function POST(req: NextRequest) {
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

    const { bookingId, discountCode, usePoints, pointsUsed, discountId } = await req.json()

    // Get booking details
    const booking = await Booking.findById(bookingId)
      .populate('serviceId')
      .populate('customerId')
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify booking belongs to customer
    if (booking.customerId._id.toString() !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get service details
    const service = await Service.findById(booking.serviceId)
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    let finalAmount = service.price
    let discountApplied = 0
    const pointsToUse = pointsUsed || 0
    let validDiscountId = null

    // Apply discount code if provided
    if (discountId) {
      const discount = await Discount.findById(discountId)
      if (discount && discount.isActive) {
        // Calculate discount amount
        if (discount.discountType === 'percentage') {
          discountApplied = (finalAmount * discount.value) / 100
          if (discount.maxDiscount && discountApplied > discount.maxDiscount) {
            discountApplied = discount.maxDiscount
          }
        } else if (discount.discountType === 'fixed') {
          discountApplied = Math.min(discount.value, finalAmount)
        }
        
        finalAmount = Math.max(0, finalAmount - discountApplied)
        validDiscountId = discountId
      }
    }

    // Apply points discount if requested
    if (usePoints && pointsToUse > 0 && decoded.id) {
      const customer = await Customer.findById(decoded.id)
      if (customer && customer.loyaltyPoints >= pointsToUse) {
        discountApplied = pointsToUse * 0.01 // $0.01 per point
        finalAmount = Math.max(0, finalAmount - discountApplied)
        
        // Deduct points from customer account immediately
        customer.loyaltyPoints -= pointsToUse
        await customer.save()
      }
    }

    // Get or create Stripe customer
    const stripeCustomer = await getOrCreateStripeCustomer(
      booking.customerId.email,
      booking.customerId.name
    )

    // Create payment intent
    const paymentIntent = await createPaymentIntent(
      finalAmount,
      'usd',
      stripeCustomer.id,
      {
        bookingId: bookingId,
        customerId: decoded.id,
        serviceId: service._id.toString(),
        pointsUsed: pointsUsed.toString(),
        discountApplied: discountApplied.toString()
      }
    )

    // Calculate points to be earned
    const pointsEarned = calculatePointsEarned(finalAmount)

    // Create payment transaction record
    const paymentTransaction = new PaymentTransaction({
      bookingId: bookingId,
      customerId: decoded.id,
      stripePaymentIntentId: paymentIntent.id,
      amount: finalAmount,
      currency: 'usd',
      status: 'pending',
      pointsEarned: pointsEarned,
      discountApplied: discountApplied,
      discountCode: discountCode || null,
      metadata: {
        pointsUsed: pointsToUse.toString(),
        serviceName: service.name,
        discountId: validDiscountId || null
      }
    })

    await paymentTransaction.save()

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: finalAmount,
      pointsEarned: pointsEarned,
      discountApplied: discountApplied,
      pointsUsed: pointsToUse
    })

  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 