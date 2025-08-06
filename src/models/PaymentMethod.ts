import mongoose from 'mongoose'

// Payment method schema
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

// Indexes for efficient queries
paymentMethodSchema.index({ customerId: 1, isActive: 1 })
paymentMethodSchema.index({ stripePaymentMethodId: 1 })
paymentMethodSchema.index({ stripeCustomerId: 1 })

// Virtual for display name
paymentMethodSchema.virtual('displayName').get(function() {
  if (this.type === 'card' && this.card) {
    return `${this.card.brand.charAt(0).toUpperCase() + this.card.brand.slice(1)} •••• ${this.card.last4}`
  } else if (this.type === 'bank_account' && this.bankAccount) {
    return `${this.bankAccount.bankName} •••• ${this.bankAccount.last4}`
  }
  return 'Payment Method'
})

// Virtual for expiration status
paymentMethodSchema.virtual('isExpired').get(function() {
  if (this.type === 'card' && this.card) {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    if (this.card.expYear < currentYear) return true
    if (this.card.expYear === currentYear && this.card.expMonth < currentMonth) return true
    
    return false
  }
  return false
})

// Method to set as default
paymentMethodSchema.methods.setAsDefault = async function() {
  // Remove default from all other payment methods for this customer
  await this.constructor.updateMany(
    { customerId: this.customerId },
    { isDefault: false }
  )
  
  // Set this as default
  this.isDefault = true
  return this.save()
}

// Method to deactivate
paymentMethodSchema.methods.deactivate = function() {
  this.isActive = false
  this.isDefault = false
  return this.save()
}

// Static method to get customer's default payment method
paymentMethodSchema.statics.getDefaultForCustomer = function(customerId: string) {
  return this.findOne({
    customerId,
    isActive: true,
    isDefault: true
  })
}

// Static method to get all active payment methods for customer
paymentMethodSchema.statics.getActiveForCustomer = function(customerId: string) {
  return this.find({
    customerId,
    isActive: true
  }).sort({ isDefault: -1, createdAt: -1 })
}

// Static method to get payment method by Stripe ID
paymentMethodSchema.statics.findByStripeId = function(stripePaymentMethodId: string) {
  return this.findOne({ stripePaymentMethodId })
}

// Static method to get payment methods by Stripe customer ID
paymentMethodSchema.statics.findByStripeCustomerId = function(stripeCustomerId: string) {
  return this.find({ stripeCustomerId, isActive: true })
}

// Static method to check if customer has any payment methods
paymentMethodSchema.statics.hasPaymentMethods = function(customerId: string) {
  return this.exists({ customerId, isActive: true })
}

// Static method to get payment method statistics
paymentMethodSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: ['$isActive', 1, 0] }
        },
        defaultCount: {
          $sum: { $cond: ['$isDefault', 1, 0] }
        }
      }
    }
  ])
}

// Static method to get expired payment methods
paymentMethodSchema.statics.getExpiredMethods = function() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  return this.find({
    type: 'card',
    isActive: true,
    $or: [
      { 'card.expYear': { $lt: currentYear } },
      {
        'card.expYear': currentYear,
        'card.expMonth': { $lt: currentMonth }
      }
    ]
  })
}

// Static method to get payment methods expiring soon
paymentMethodSchema.statics.getExpiringSoon = function(months: number = 3) {
  const now = new Date()
  const futureDate = new Date()
  futureDate.setMonth(futureDate.getMonth() + months)
  
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const futureYear = futureDate.getFullYear()
  const futureMonth = futureDate.getMonth() + 1
  
  return this.find({
    type: 'card',
    isActive: true,
    $or: [
      {
        'card.expYear': { $gte: currentYear, $lte: futureYear },
        'card.expMonth': { $gte: currentMonth }
      },
      {
        'card.expYear': futureYear,
        'card.expMonth': { $lte: futureMonth }
      }
    ]
  })
}

export default mongoose.models.PaymentMethod || mongoose.model('PaymentMethod', paymentMethodSchema) 