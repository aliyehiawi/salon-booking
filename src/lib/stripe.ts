import Stripe from 'stripe'
import { config } from './config'

// Initialize Stripe with error handling
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe | null {
  if (stripeInstance) return stripeInstance
  
  try {
    // Check if Stripe keys are properly configured
    if (!config.stripeSecretKey || 
        config.stripeSecretKey.includes('placeholder') ||
        config.stripeSecretKey.includes('your_stripe') ||
        config.stripeSecretKey === 'sk_test_your_secret_key_here') {
      console.warn('Stripe is not configured - using placeholder keys')
      return null
    }
    
    stripeInstance = new Stripe(config.stripeSecretKey, {
      apiVersion: '2024-12-18.acacia'
    })
    
    return stripeInstance
  } catch (error) {
    console.error('Failed to initialize Stripe:', error)
    return null
  }
}

// Export stripe for backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    const stripeInstance = getStripe()
    if (!stripeInstance) {
      throw new Error('Stripe is not configured. Please add your Stripe keys to the .env file.')
    }
    return stripeInstance[prop as keyof Stripe]
  }
})

// Create or retrieve Stripe customer
export async function getOrCreateStripeCustomer(email: string, name?: string) {
  try {
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0]
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        source: 'salon-booking'
      }
    })

    return customer
  } catch (error) {
    console.error('Error creating/retrieving Stripe customer:', error)
    throw error
  }
}

// Create payment intent
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  customerId: string,
  metadata: Record<string, string> = {}
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      customer: customerId,
      metadata: {
        ...metadata,
        source: 'salon-booking'
      },
      automatic_payment_methods: {
        enabled: true
      }
    })

    return paymentIntent
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

// Attach payment method to customer
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
) {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    })

    return paymentMethod
  } catch (error) {
    console.error('Error attaching payment method:', error)
    throw error
  }
}

// Get customer's payment methods
export async function getCustomerPaymentMethods(customerId: string) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    })

    return paymentMethods.data
  } catch (error) {
    console.error('Error getting customer payment methods:', error)
    throw error
  }
}

// Set default payment method
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
) {
  try {
    const customer = await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    })

    return customer
  } catch (error) {
    console.error('Error setting default payment method:', error)
    throw error
  }
}

// Detach payment method
export async function detachPaymentMethod(paymentMethodId: string) {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId)
    return paymentMethod
  } catch (error) {
    console.error('Error detaching payment method:', error)
    throw error
  }
}

// Calculate points earned from payment
export function calculatePointsEarned(amount: number): number {
  return Math.floor(amount * config.pointsPerDollar)
}

// Calculate discount from points
export function calculateDiscountFromPoints(points: number): number {
  return points * config.pointsToDiscountRate
}

// Calculate points needed for discount
export function calculatePointsNeededForDiscount(discountAmount: number): number {
  return Math.ceil(discountAmount / config.pointsToDiscountRate)
} 