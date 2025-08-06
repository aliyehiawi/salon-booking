import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { verifyTokenString } from '@/lib/auth'
import { 
  getOrCreateStripeCustomer, 
  attachPaymentMethod, 
  getCustomerPaymentMethods,
  setDefaultPaymentMethod,
  detachPaymentMethod 
} from '@/lib/stripe'
import PaymentMethod from '@/models/PaymentMethod'
import Customer from '@/models/Customer'

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

    // Get customer's saved payment methods
    const paymentMethods = await PaymentMethod.find({
      customerId: decoded.id,
      isActive: true
    }).sort({ isDefault: -1, createdAt: -1 })

    return NextResponse.json(paymentMethods)

  } catch (error: any) {
    console.error('Error getting payment methods:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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

    const { paymentMethodId, saveForLater } = await req.json()

    // Get customer details
    const customer = await Customer.findById(decoded.id)
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get or create Stripe customer
    const stripeCustomer = await getOrCreateStripeCustomer(
      customer.email,
      customer.name
    )

    // Attach payment method to Stripe customer
    const stripePaymentMethod = await attachPaymentMethod(
      paymentMethodId,
      stripeCustomer.id
    )

    let savedPaymentMethod = null

    if (saveForLater) {
      // Save payment method to database
      const paymentMethodData = {
        customerId: decoded.id,
        stripePaymentMethodId: paymentMethodId,
        stripeCustomerId: stripeCustomer.id,
        type: 'card',
        card: {
          brand: stripePaymentMethod.card?.brand || '',
          last4: stripePaymentMethod.card?.last4 || '',
          expMonth: stripePaymentMethod.card?.exp_month || 0,
          expYear: stripePaymentMethod.card?.exp_year || 0,
          fingerprint: stripePaymentMethod.card?.fingerprint || ''
        },
        isDefault: false,
        isActive: true
      }

      savedPaymentMethod = new PaymentMethod(paymentMethodData)
      await savedPaymentMethod.save()
    }

    return NextResponse.json({
      success: true,
      paymentMethod: savedPaymentMethod,
      message: saveForLater ? 'Payment method saved successfully' : 'Payment method attached successfully'
    })

  } catch (error: any) {
    console.error('Error saving payment method:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
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

    const { paymentMethodId, action } = await req.json()

    if (action === 'setDefault') {
      // Set as default payment method
      const paymentMethod = await PaymentMethod.findOne({
        _id: paymentMethodId,
        customerId: decoded.id
      })

      if (!paymentMethod) {
        return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
      }

      // Remove default from all other payment methods
      await PaymentMethod.updateMany(
        { customerId: decoded.id },
        { isDefault: false }
      )

      // Set this as default
      paymentMethod.isDefault = true
      await paymentMethod.save()

      // Update Stripe customer default payment method
      await setDefaultPaymentMethod(
        paymentMethod.stripeCustomerId,
        paymentMethod.stripePaymentMethodId
      )

      return NextResponse.json({
        success: true,
        message: 'Default payment method updated'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error: any) {
    console.error('Error updating payment method:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const paymentMethodId = searchParams.get('id')

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 })
    }

    // Get payment method
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      customerId: decoded.id
    })

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    // Detach from Stripe
    await detachPaymentMethod(paymentMethod.stripePaymentMethodId)

    // Mark as inactive in database
    paymentMethod.isActive = false
    await paymentMethod.save()

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully'
    })

  } catch (error: any) {
    console.error('Error removing payment method:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 