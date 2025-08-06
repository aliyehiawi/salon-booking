'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { CreditCard, Star, Gift, X, CheckCircle } from 'lucide-react'

// Load Stripe only if publishable key is available and valid
const getStripePromise = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY
  console.log('Stripe publishable key:', publishableKey)
  if (!publishableKey || 
      publishableKey.includes('placeholder') ||
      publishableKey.includes('your_stripe') ||
      publishableKey.length < 10) {
    console.log('Stripe key invalid or missing')
    return null
  }
  
  return loadStripe(publishableKey)
}

const stripePromise = getStripePromise()

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  amount: number
  serviceName: string
  onSuccess: () => void
}

interface PaymentMethod {
  _id: string
  card: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
}

interface CustomerLoyalty {
  points: number
  tier: string
  totalSpent: number
}

function PaymentForm({ 
  bookingId, 
  amount, 
  serviceName, 
  onSuccess, 
  onClose 
}: {
  bookingId: string
  amount: number
  serviceName: string
  onSuccess: () => void
  onClose: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { user, token } = useAuth()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [saveForLater, setSaveForLater] = useState(false)
  const [usePoints, setUsePoints] = useState(false)
  const [customerLoyalty, setCustomerLoyalty] = useState<CustomerLoyalty | null>(null)
  const [discountCode, setDiscountCode] = useState('')
  const [finalAmount, setFinalAmount] = useState(amount)
  const [pointsUsed, setPointsUsed] = useState(0)
  const [discountApplied, setDiscountApplied] = useState(0)
  const [validDiscountId, setValidDiscountId] = useState<string | null>(null)
  const [discountValidating, setDiscountValidating] = useState(false)

  // Calculate final amount when discounts or points change
  useEffect(() => {
    let calculatedAmount = amount
    
    // Apply discount if any
    if (discountApplied > 0) {
      calculatedAmount -= discountApplied
    }
    
    // Apply points discount if used
    if (pointsUsed > 0) {
      const pointsDiscount = pointsUsed * 0.01 // 1 point = $0.01
      calculatedAmount -= pointsDiscount
    }
    
    // Ensure amount doesn't go below 0
    calculatedAmount = Math.max(0, calculatedAmount)
    
    setFinalAmount(calculatedAmount)
  }, [amount, discountApplied, pointsUsed])

  useEffect(() => {
    if (user && token) {
      fetchPaymentMethods()
      fetchCustomerLoyalty()
    }
  }, [user, token])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payments/methods', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const methods = await response.json()
        setSavedPaymentMethods(methods)
        if (methods.length > 0) {
          setSelectedPaymentMethod(methods[0]._id)
        }
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    }
  }

  const fetchCustomerLoyalty = async () => {
    try {
      const response = await fetch('/api/auth/loyalty', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const loyalty = await response.json()
        setCustomerLoyalty(loyalty)
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setLoading(true)

    try {
      // Create payment intent
      const intentResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId,
          discountCode: discountCode || undefined,
          discountId: validDiscountId,
          usePoints: pointsUsed > 0,
          pointsUsed: pointsUsed
        })
      })

      if (!intentResponse.ok) {
        throw new Error('Failed to create payment intent')
      }

      const intentData = await intentResponse.json()

      // Confirm payment with CardElement
      const { error } = await stripe!.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: user?.name || 'Customer',
            email: user?.email || ''
          }
        }
      })

      if (error) {
        showToast(error.message || 'Payment failed', 'error')
      } else {
        // Save payment method if requested
        if (saveForLater && elements.getElement(CardElement)) {
          const cardElement = elements.getElement(CardElement)
          if (cardElement) {
            const { paymentMethod } = await stripe.createPaymentMethod({
              type: 'card',
              card: cardElement,
            })

            if (paymentMethod) {
              await fetch('/api/payments/methods', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  paymentMethodId: paymentMethod.id,
                  saveForLater: true
                })
              })
            }
          }
        }

        showToast('Payment successful! Your appointment is confirmed.', 'success')
        onSuccess()
        onClose()
      }
    } catch (error: any) {
      showToast(error.message || 'Payment failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) return

    setDiscountValidating(true)
    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          discountCode: discountCode.trim(),
          bookingAmount: amount
        })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setDiscountApplied(data.discountAmount)
        setValidDiscountId(data.discountId)
        showToast(`Discount applied! ${data.name} - $${data.discountAmount.toFixed(2)} off`, 'success')
      } else {
        setDiscountApplied(0)
        setValidDiscountId(null)
        showToast(data.error || 'Invalid discount code', 'error')
      }
    } catch (error) {
      setDiscountApplied(0)
      setValidDiscountId(null)
      showToast('Failed to validate discount code', 'error')
    } finally {
      setDiscountValidating(false)
    }
  }

  const handleSavedPaymentMethod = async () => {
    if (!selectedPaymentMethod) return

    setLoading(true)

    try {
      // Create payment intent with saved payment method
      const intentResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId,
          discountCode: discountCode || undefined,
          discountId: validDiscountId,
          usePoints: pointsUsed > 0,
          pointsUsed: pointsUsed,
          paymentMethodId: selectedPaymentMethod
        })
      })

      if (!intentResponse.ok) {
        throw new Error('Failed to create payment intent')
      }

      const intentData = await intentResponse.json()

      // Confirm payment with saved method
      const { error } = await stripe!.confirmCardPayment(intentData.clientSecret, {
        payment_method: selectedPaymentMethod
      })

      if (error) {
        showToast(error.message || 'Payment failed', 'error')
      } else {
        showToast('Payment successful! Your appointment is confirmed.', 'success')
        onSuccess()
        onClose()
      }
    } catch (error: any) {
      showToast(error.message || 'Payment failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const removePaymentMethod = async (methodId: string) => {
    try {
      const response = await fetch(`/api/payments/methods?id=${methodId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        setSavedPaymentMethods(prev => prev.filter(m => m._id !== methodId))
        if (selectedPaymentMethod === methodId) {
          setSelectedPaymentMethod(null)
        }
        showToast('Payment method removed', 'success')
      }
    } catch (error) {
      showToast('Failed to remove payment method', 'error')
    }
  }

  const setDefaultPaymentMethod = async (methodId: string) => {
    try {
      const response = await fetch('/api/payments/methods', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethodId: methodId,
          action: 'setDefault'
        })
      })

      if (response.ok) {
        setSavedPaymentMethods(prev => 
          prev.map(m => ({ ...m, isDefault: m._id === methodId }))
        )
        showToast('Default payment method updated', 'success')
      }
    } catch (error) {
      showToast('Failed to update default payment method', 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Complete Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Service Details with Price Breakdown */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-900">{serviceName}</h3>
            
            {/* Price Breakdown */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Service Price:</span>
                <span>${amount.toFixed(2)}</span>
              </div>
              
              {/* Show discount if applied */}
              {discountApplied > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount Applied:</span>
                  <span>-${discountApplied.toFixed(2)}</span>
                </div>
              )}
              
              {/* Show points discount if used */}
              {pointsUsed > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Points Used ({pointsUsed} pts):</span>
                  <span>-${(pointsUsed * 0.01).toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t pt-1 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total to Pay:</span>
                  <span>${finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Points */}
          {customerLoyalty && customerLoyalty.points > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">
                    {customerLoyalty.points} points available
                  </span>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-blue-700">Use points</span>
                </label>
              </div>
              {usePoints && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-blue-600">
                    You can use up to {Math.min(customerLoyalty.points, Math.floor(amount * 100))} points
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max={Math.min(customerLoyalty.points, Math.floor(amount * 100))}
                      value={pointsUsed}
                      onChange={(e) => setPointsUsed(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-blue-700 font-medium">
                      {pointsUsed} pts (${(pointsUsed * 0.01).toFixed(2)})
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Saved Payment Methods */}
          {savedPaymentMethods.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Saved Payment Methods</h3>
              <div className="space-y-2">
                {savedPaymentMethods.map((method) => (
                  <div
                    key={method._id}
                    className={`border rounded-lg p-3 cursor-pointer ${
                      selectedPaymentMethod === method._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm">
                          {method.card.brand.toUpperCase()} •••• {method.card.last4}
                        </span>
                        {method.isDefault && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {!method.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDefaultPaymentMethod(method._id)
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removePaymentMethod(method._id)
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedPaymentMethod && (
                <button
                  onClick={handleSavedPaymentMethod}
                  disabled={loading}
                  className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Pay with Saved Method'}
                </button>
              )}
            </div>
          )}

          {/* Discount Code - Only for Online Payments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Code (Online payments only)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="Enter discount code"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={validateDiscountCode}
                disabled={discountValidating || !discountCode.trim()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {discountValidating ? 'Validating...' : 'Apply'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Discounts are only available for online payments, not for pay-at-visit appointments
            </p>
          </div>

          {/* Payment Options */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Choose Payment Option</h3>
            
            {/* Pay at Appointment Option */}
            <div className="mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center mb-3">
                  <Gift className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-green-900">Pay at Appointment</h4>
                  <p className="text-sm text-green-700">${amount.toFixed(2)} due when you arrive</p>
                  <p className="text-xs text-green-600 mt-1">
                    Note: Discounts and points are only available for online payments
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Reset any discounts/points since they don't apply to pay-at-visit
                    setDiscountApplied(0)
                    setPointsUsed(0)
                    setValidDiscountId(null)
                    showToast('Appointment confirmed! Payment due at appointment.', 'success')
                    onSuccess()
                    onClose()
                  }}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Gift className="w-5 h-5" />
                  Confirm Appointment (Pay at Visit)
                </button>
              </div>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or pay online now</span>
              </div>
            </div>

            {/* Online Payment Option */}
            <div>
              {!stripePromise ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-center">
                    <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <h4 className="text-sm font-medium text-gray-700">Online Payment Unavailable</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Stripe payment processing is not configured yet
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    {savedPaymentMethods.length > 0 ? 'Use saved payment method or add new' : 'Pay with Credit Card'}
                  </h4>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      {stripe ? (
                        <CardElement
                          options={{
                            style: {
                              base: {
                                fontSize: '16px',
                                color: '#424770',
                                '::placeholder': {
                                  color: '#aab7c4',
                                },
                              },
                              invalid: {
                                color: '#9e2146',
                              },
                            },
                          }}
                        />
                      ) : (
                        <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                          <p className="text-gray-500 text-sm">Loading payment form...</p>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={saveForLater}
                          onChange={(e) => setSaveForLater(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Save this payment method for future use</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !stripe}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      {loading ? 'Processing...' : `Pay $${finalAmount.toFixed(2)} Online`}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="text-xs text-gray-500 text-center">
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Your payment information is secure and encrypted
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentModal(props: PaymentModalProps) {
  if (!props.isOpen) return null

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
} 