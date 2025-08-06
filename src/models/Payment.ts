import mongoose from 'mongoose'

const paymentMethodSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  stripePaymentMethodId: {
    type: String,
    required: true,
    unique: true
  },
  stripeCustomerId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['card', 'bank_account'],
    required: true
  },
  card: {
    brand: String,
    last4: String,
    expMonth: Number,
    expYear: Number,
    fingerprint: String
  },
  bankAccount: {
    bankName: String,
    last4: String,
    routingNumber: String
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

const paymentTransactionSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  stripePaymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'canceled'],
    default: 'pending'
  },
  paymentMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod'
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  discountApplied: {
    type: Number,
    default: 0
  },
  discountCode: String,
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
})

// Indexes for efficient queries (only non-unique ones, since unique indexes are defined in schema)
paymentMethodSchema.index({ customerId: 1, isActive: 1 })
paymentTransactionSchema.index({ bookingId: 1 })
paymentTransactionSchema.index({ customerId: 1 })

export const PaymentMethod = mongoose.models.PaymentMethod || mongoose.model('PaymentMethod', paymentMethodSchema)
export const PaymentTransaction = mongoose.models.PaymentTransaction || mongoose.model('PaymentTransaction', paymentTransactionSchema) 