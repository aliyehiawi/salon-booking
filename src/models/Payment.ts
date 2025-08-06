import mongoose from 'mongoose'

// Payment transaction schema
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
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'usd',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'cash', 'other'],
    default: 'card'
  },
  discountCode: {
    type: String,
    default: null
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  pointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  pointsRedeemed: {
    type: Number,
    default: 0,
    min: 0
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  errorMessage: {
    type: String,
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
paymentTransactionSchema.index({ bookingId: 1 })
paymentTransactionSchema.index({ customerId: 1 })
paymentTransactionSchema.index({ stripePaymentIntentId: 1 })
paymentTransactionSchema.index({ status: 1 })
paymentTransactionSchema.index({ createdAt: -1 })

// Virtual for net amount (after discounts)
paymentTransactionSchema.virtual('netAmount').get(function() {
  return this.amount - this.discountAmount
})

// Virtual for total points (earned - redeemed)
paymentTransactionSchema.virtual('netPoints').get(function() {
  return this.pointsEarned - this.pointsRedeemed
})

// Method to mark as succeeded
paymentTransactionSchema.methods.markSucceeded = function() {
  this.status = 'succeeded'
  this.processedAt = new Date()
  return this.save()
}

// Method to mark as failed
paymentTransactionSchema.methods.markFailed = function(errorMessage?: string) {
  this.status = 'failed'
  this.errorMessage = errorMessage || null
  this.processedAt = new Date()
  return this.save()
}

// Method to mark as cancelled
paymentTransactionSchema.methods.markCancelled = function() {
  this.status = 'cancelled'
  this.processedAt = new Date()
  return this.save()
}

// Static method to get payment by Stripe intent ID
paymentTransactionSchema.statics.findByStripeIntentId = function(intentId: string) {
  return this.findOne({ stripePaymentIntentId: intentId })
}

// Static method to get payments by customer
paymentTransactionSchema.statics.findByCustomer = function(customerId: string) {
  return this.find({ customerId })
    .sort({ createdAt: -1 })
    .populate('bookingId', 'serviceName date time')
}

// Static method to get payments by booking
paymentTransactionSchema.statics.findByBooking = function(bookingId: string) {
  return this.find({ bookingId })
    .sort({ createdAt: -1 })
}

// Static method to get successful payments
paymentTransactionSchema.statics.findSuccessful = function() {
  return this.find({ status: 'succeeded' })
    .sort({ createdAt: -1 })
}

// Static method to get failed payments
paymentTransactionSchema.statics.findFailed = function() {
  return this.find({ status: 'failed' })
    .sort({ createdAt: -1 })
}

// Static method to get payment statistics
paymentTransactionSchema.statics.getPaymentStats = function(startDate?: Date, endDate?: Date) {
  const matchStage: any = { status: 'succeeded' }
  
  if (startDate || endDate) {
    matchStage.createdAt = {}
    if (startDate) matchStage.createdAt.$gte = startDate
    if (endDate) matchStage.createdAt.$lte = endDate
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalDiscounts: { $sum: '$discountAmount' },
        totalPointsEarned: { $sum: '$pointsEarned' },
        totalPointsRedeemed: { $sum: '$pointsRedeemed' },
        averageAmount: { $avg: '$amount' }
      }
    }
  ])
}

// Static method to get daily payment trends
paymentTransactionSchema.statics.getDailyTrends = function(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return this.aggregate([
    {
      $match: {
        status: 'succeeded',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalDiscounts: { $sum: '$discountAmount' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ])
}

// Static method to get payment method distribution
paymentTransactionSchema.statics.getPaymentMethodDistribution = function() {
  return this.aggregate([
    { $match: { status: 'succeeded' } },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    { $sort: { count: -1 } }
  ])
}

// Static method to get discount usage statistics
paymentTransactionSchema.statics.getDiscountStats = function() {
  return this.aggregate([
    {
      $match: {
        status: 'succeeded',
        discountCode: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$discountCode',
        usageCount: { $sum: 1 },
        totalDiscountAmount: { $sum: '$discountAmount' },
        totalTransactionAmount: { $sum: '$amount' }
      }
    },
    { $sort: { usageCount: -1 } }
  ])
}

// Static method to get customer payment history
paymentTransactionSchema.statics.getCustomerPaymentHistory = function(customerId: string) {
  return this.find({ customerId })
    .sort({ createdAt: -1 })
    .populate('bookingId', 'serviceName date time status')
    .populate('customerId', 'name email')
}

// Static method to get recent payments
paymentTransactionSchema.statics.getRecentPayments = function(limit: number = 10) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('bookingId', 'serviceName date time')
    .populate('customerId', 'name email')
}

// Static method to get payments by date range
paymentTransactionSchema.statics.getPaymentsByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  })
    .sort({ createdAt: -1 })
    .populate('bookingId', 'serviceName date time')
    .populate('customerId', 'name email')
}

// Static method to get refund statistics
paymentTransactionSchema.statics.getRefundStats = function() {
  return this.aggregate([
    {
      $match: {
        status: 'cancelled',
        metadata: { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        totalRefunds: { $sum: 1 },
        totalRefundAmount: { $sum: '$amount' },
        averageRefundAmount: { $avg: '$amount' }
      }
    }
  ])
}

// Static method to get payment success rate
paymentTransactionSchema.statics.getSuccessRate = function(startDate?: Date, endDate?: Date) {
  const matchStage: any = {}
  
  if (startDate || endDate) {
    matchStage.createdAt = {}
    if (startDate) matchStage.createdAt.$gte = startDate
    if (endDate) matchStage.createdAt.$lte = endDate
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ])
}

// Static method to get top customers by spending
paymentTransactionSchema.statics.getTopSpenders = function(limit: number = 10) {
  return this.aggregate([
    { $match: { status: 'succeeded' } },
    {
      $group: {
        _id: '$customerId',
        totalSpent: { $sum: '$amount' },
        totalPayments: { $sum: 1 },
        averagePayment: { $avg: '$amount' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer'
      }
    },
    { $unwind: '$customer' },
    {
      $project: {
        customerId: '$_id',
        customerName: '$customer.name',
        customerEmail: '$customer.email',
        totalSpent: 1,
        totalPayments: 1,
        averagePayment: 1
      }
    }
  ])
}

export const PaymentTransaction = mongoose.models.PaymentTransaction || mongoose.model('PaymentTransaction', paymentTransactionSchema)

export default PaymentTransaction 