import mongoose from 'mongoose'

const discountSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  // For percentage discounts, max value is 100
  // For fixed discounts, value is in dollars
  maxDiscount: {
    type: Number,
    default: null
  },
  minimumAmount: {
    type: Number,
    default: 0
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  // If empty, applies to all services
  customerRestrictions: {
    newCustomersOnly: {
      type: Boolean,
      default: false
    },
    existingCustomersOnly: {
      type: Boolean,
      default: false
    },
    minimumTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
      default: null
    },
    specificCustomers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }]
  },
  usageHistory: [{
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    discountAmount: {
      type: Number,
      required: true
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
// Code field already has unique: true in schema definition
discountSchema.index({ isActive: 1, validUntil: 1 })
discountSchema.index({ 'usageHistory.customerId': 1 })

// Virtual for checking if discount is valid
discountSchema.virtual('isValid').get(function() {
  const now = new Date()
  return this.isActive && 
         this.validFrom <= now && 
         this.validUntil >= now &&
         (this.usageLimit === null || this.usedCount < this.usageLimit)
})

// Method to validate discount for a specific customer and amount
discountSchema.methods.validateForCustomer = function(customerId: string, amount: number, isNewCustomer: boolean) {
  if (!this.isValid) {
    return { valid: false, reason: 'Discount is not active or expired' }
  }

  if (amount < this.minimumAmount) {
    return { 
      valid: false, 
      reason: `Minimum purchase amount of $${this.minimumAmount} required` 
    }
  }

  if (this.customerRestrictions.newCustomersOnly && !isNewCustomer) {
    return { valid: false, reason: 'Discount is for new customers only' }
  }

  if (this.customerRestrictions.existingCustomersOnly && isNewCustomer) {
    return { valid: false, reason: 'Discount is for existing customers only' }
  }

  // Check if customer has already used this discount
  const hasUsed = this.usageHistory.some((usage: any) => 
    usage.customerId.toString() === customerId
  )
  if (hasUsed) {
    return { valid: false, reason: 'You have already used this discount' }
  }

  return { valid: true }
}

// Method to calculate discount amount
discountSchema.methods.calculateDiscount = function(amount: number) {
  let discountAmount = 0

  if (this.discountType === 'percentage') {
    discountAmount = (amount * this.value) / 100
  } else {
    discountAmount = this.value
  }

  // Apply maximum discount limit if set
  if (this.maxDiscount && discountAmount > this.maxDiscount) {
    discountAmount = this.maxDiscount
  }

  return Math.min(discountAmount, amount) // Can't discount more than the total amount
}

export default mongoose.models.Discount || mongoose.model('Discount', discountSchema) 