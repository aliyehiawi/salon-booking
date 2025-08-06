import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import dbConnect from '@/lib/dbConnect'
import { stripe } from '@/lib/stripe'
import { config } from '@/lib/config'
import { PaymentTransaction } from '@/models/Payment'
import Booking from '@/models/Booking'
import Customer from '@/models/Customer'
import CustomerLoyalty from '@/models/CustomerLoyalty'
import Discount from '@/models/Discount'
import { BADGES, TIER_THRESHOLDS } from '@/models/CustomerLoyalty'

export async function POST(req: NextRequest) {
  await dbConnect()
  
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: any

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        config.stripeWebhookSecret
      )
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object)
        break
      
      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    // Find payment transaction
    const transaction = await PaymentTransaction.findOne({
      stripePaymentIntentId: paymentIntent.id
    })

    if (!transaction) {
      console.error('Payment transaction not found:', paymentIntent.id)
      return
    }

    // Update transaction status
    transaction.status = 'succeeded'
    await transaction.save()

    // Update booking status to confirmed and paid
    const booking = await Booking.findById(transaction.bookingId)
    if (booking) {
      booking.status = 'confirmed'
      booking.paymentStatus = 'paid'
      await booking.save()
    }

    // Track discount usage if a discount was applied
    if (transaction.discountCode) {
      await trackDiscountUsage(transaction.discountCode, transaction.customerId)
    }

    // Update customer loyalty points and check for badges/milestones
    if (transaction.pointsEarned > 0) {
      await updateCustomerLoyalty(transaction.customerId, transaction.pointsEarned, transaction.amount)
    }

    console.log(`Payment succeeded for booking ${transaction.bookingId}`)

  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    // Find payment transaction
    const transaction = await PaymentTransaction.findOne({
      stripePaymentIntentId: paymentIntent.id
    })

    if (!transaction) {
      console.error('Payment transaction not found:', paymentIntent.id)
      return
    }

    // Update transaction status
    transaction.status = 'failed'
    await transaction.save()

    // Update booking status
    const booking = await Booking.findById(transaction.bookingId)
    if (booking) {
      booking.status = 'pending'
      booking.paymentStatus = 'failed'
      await booking.save()
    }

    console.log(`Payment failed for booking ${transaction.bookingId}`)

  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function handlePaymentMethodAttached(paymentMethod: any) {
  try {
    console.log(`Payment method ${paymentMethod.id} attached to customer ${paymentMethod.customer}`)
  } catch (error) {
    console.error('Error handling payment method attached:', error)
  }
}

async function handlePaymentMethodDetached(paymentMethod: any) {
  try {
    console.log(`Payment method ${paymentMethod.id} detached from customer ${paymentMethod.customer}`)
  } catch (error) {
    console.error('Error handling payment method detached:', error)
  }
}

async function trackDiscountUsage(discountCode: string, customerId: string) {
  try {
    const discount = await Discount.findOne({ code: discountCode })
    if (discount) {
      // Increment usage count
      discount.usedCount += 1
      
      // Add usage history
      discount.usageHistory.push({
        customerId: customerId,
        usedAt: new Date(),
        amount: 0 // We don't store the amount in usage history for simplicity
      })
      
      await discount.save()
      console.log(`Discount ${discountCode} usage tracked for customer ${customerId}`)
    }
  } catch (error) {
    console.error('Error tracking discount usage:', error)
  }
}

async function updateCustomerLoyalty(customerId: string, pointsEarned: number, amount: number) {
  try {
    // Get or create customer loyalty record
    let loyalty = await CustomerLoyalty.findOne({ customerId })
    
    if (!loyalty) {
      loyalty = new CustomerLoyalty({
        customerId,
        points: 0,
        totalSpent: 0,
        totalBookings: 0,
        tier: 'bronze',
        badges: [],
        milestones: [],
        activeDiscounts: []
      })
    }

    // Update points and spending
    loyalty.points += pointsEarned
    loyalty.totalSpent += amount
    loyalty.totalBookings += 1
    loyalty.lastActivity = new Date()

    // Check for tier upgrades
    const newTier = calculateTier(loyalty.totalBookings, loyalty.totalSpent)
    if (newTier !== loyalty.tier) {
      loyalty.tier = newTier
      
      // Add tier badge
      const tierBadge = getTierBadge(newTier)
      if (tierBadge && !loyalty.badges.find(b => b.name === tierBadge.name)) {
        loyalty.badges.push(tierBadge)
      }
    }

    // Check for new badges
    const newBadges = checkForNewBadges(loyalty)
    loyalty.badges.push(...newBadges)

    // Check for milestones
    const newMilestones = checkForMilestones(loyalty)
    loyalty.milestones.push(...newMilestones)

    await loyalty.save()

    console.log(`Updated loyalty for customer ${customerId}: +${pointsEarned} points, new tier: ${loyalty.tier}`)

  } catch (error) {
    console.error('Error updating customer loyalty:', error)
  }
}

function calculateTier(totalBookings: number, totalSpent: number): string {
  if (totalBookings >= TIER_THRESHOLDS.diamond.minBookings && totalSpent >= TIER_THRESHOLDS.diamond.minSpent) {
    return 'diamond'
  } else if (totalBookings >= TIER_THRESHOLDS.platinum.minBookings && totalSpent >= TIER_THRESHOLDS.platinum.minSpent) {
    return 'platinum'
  } else if (totalBookings >= TIER_THRESHOLDS.gold.minBookings && totalSpent >= TIER_THRESHOLDS.gold.minSpent) {
    return 'gold'
  } else if (totalBookings >= TIER_THRESHOLDS.silver.minBookings && totalSpent >= TIER_THRESHOLDS.silver.minSpent) {
    return 'silver'
  } else {
    return 'bronze'
  }
}

function getTierBadge(tier: string) {
  switch (tier) {
    case 'silver':
      return BADGES.SILVER_TIER
    case 'gold':
      return BADGES.GOLD_TIER
    case 'platinum':
      return BADGES.PLATINUM_TIER
    default:
      return null
  }
}

function checkForNewBadges(loyalty: any) {
  const newBadges = []
  const existingBadgeNames = loyalty.badges.map((b: any) => b.name)

  // First booking badge
  if (loyalty.totalBookings === 1 && !existingBadgeNames.includes(BADGES.FIRST_BOOKING.name)) {
    newBadges.push(BADGES.FIRST_BOOKING)
  }

  // Regular customer badge
  if (loyalty.totalBookings === 5 && !existingBadgeNames.includes(BADGES.REGULAR_CUSTOMER.name)) {
    newBadges.push(BADGES.REGULAR_CUSTOMER)
  }

  // Loyal customer badge
  if (loyalty.totalBookings === 10 && !existingBadgeNames.includes(BADGES.LOYAL_CUSTOMER.name)) {
    newBadges.push(BADGES.LOYAL_CUSTOMER)
  }

  // Big spender badge
  if (loyalty.totalSpent >= 500 && !existingBadgeNames.includes(BADGES.BIG_SPENDER.name)) {
    newBadges.push(BADGES.BIG_SPENDER)
  }

  return newBadges
}

function checkForMilestones(loyalty: any) {
  const newMilestones = []
  const existingMilestoneNames = loyalty.milestones.map((m: any) => m.name)

  // Booking milestones
  const bookingMilestones = [5, 10, 25, 50, 100]
  bookingMilestones.forEach(threshold => {
    if (loyalty.totalBookings === threshold && !existingMilestoneNames.includes(`${threshold} Bookings`)) {
      newMilestones.push({
        name: `${threshold} Bookings`,
        type: 'bookings',
        threshold: threshold,
        reward: 'points',
        rewardValue: threshold * 10,
        achievedAt: new Date(),
        isRedeemed: false
      })
    }
  })

  // Spending milestones
  const spendingMilestones = [100, 250, 500, 1000, 2000]
  spendingMilestones.forEach(threshold => {
    if (loyalty.totalSpent >= threshold && !existingMilestoneNames.includes(`$${threshold} Spent`)) {
      newMilestones.push({
        name: `$${threshold} Spent`,
        type: 'spending',
        threshold: threshold,
        reward: 'discount',
        rewardValue: threshold * 0.05, // 5% discount
        achievedAt: new Date(),
        isRedeemed: false
      })
    }
  })

  return newMilestones
} 