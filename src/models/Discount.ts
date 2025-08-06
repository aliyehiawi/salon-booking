import mongoose from 'mongoose'

// Usage history schema
const usageHistorySchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0
  },
  usedAt: {
    type: Date,
    default: Date.now
  }
})

// Main discount schema
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
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: null,
    min: 0
  },
  minimumAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  usageLimit: {
    type: Number,
    default: null,
    min: 1
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  usageHistory: [usageHistorySchema],
  validFrom: {
    type: Date,
    required: true
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
  excludedServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  customerRestrictions: {
    newCustomersOnly: {
      type: Boolean,
      default: false
    },
    existingCustomersOnly: {
      type: Boolean,
      default: false
    },
    minimumBookings: {
      type: Number,
      default: 0,
      min: 0
    },
    minimumSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    specificCustomers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }]
  },
  usageRestrictions: {
    oneTimeUse: {
      type: Boolean,
      default: false
    },
    perCustomerLimit: {
      type: Number,
      default: null,
      min: 1
    },
    perBookingLimit: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
discountSchema.index({ code: 1 })
discountSchema.index({ isActive: 1 })
discountSchema.index({ validFrom: 1, validUntil: 1 })
discountSchema.index({ usedCount: 1 })
discountSchema.index({ createdAt: -1 })

// Virtual for remaining usage
discountSchema.virtual('remainingUsage').get(function() {
  if (!this.usageLimit) return null
  return Math.max(0, this.usageLimit - this.usedCount)
})

// Virtual for is expired
discountSchema.virtual('isExpired').get(function() {
  return new Date() > this.validUntil
})

// Virtual for is valid
discountSchema.virtual('isValid').get(function() {
  const now = new Date()
  return this.isActive && 
         now >= this.validFrom && 
         now <= this.validUntil &&
         (!this.usageLimit || this.usedCount < this.usageLimit)
})

// Method to calculate discount amount
discountSchema.methods.calculateDiscount = function(amount: number): number {
  if (!this.isValid) {
    return 0
  }

  let discountAmount = 0

  if (this.type === 'percentage') {
    discountAmount = (amount * this.value) / 100
  } else {
    discountAmount = this.value
  }

  // Apply maximum discount limit
  if (this.maxDiscount && discountAmount > this.maxDiscount) {
    discountAmount = this.maxDiscount
  }

  // Ensure discount doesn't exceed the amount
  return Math.min(discountAmount, amount)
}

// Method to validate discount for customer
discountSchema.methods.validateForCustomer = async function(customerId: string, customerBookings: number = 0, customerSpent: number = 0): Promise<{ valid: boolean; message?: string }> {
  if (!this.isValid) {
    return { valid: false, message: 'Discount code is not valid or has expired' }
  }

  // Check minimum amount requirement
  if (this.minimumAmount > 0) {
    return { valid: false, message: `Minimum purchase amount of $${this.minimumAmount} required` }
  }

  // Check customer restrictions
  if (this.customerRestrictions.newCustomersOnly && customerBookings > 0) {
    return { valid: false, message: 'This discount is only for new customers' }
  }

  if (this.customerRestrictions.existingCustomersOnly && customerBookings === 0) {
    return { valid: false, message: 'This discount is only for existing customers' }
  }

  if (this.customerRestrictions.minimumBookings > 0 && customerBookings < this.customerRestrictions.minimumBookings) {
    return { valid: false, message: `Minimum ${this.customerRestrictions.minimumBookings} bookings required` }
  }

  if (this.customerRestrictions.minimumSpent > 0 && customerSpent < this.customerRestrictions.minimumSpent) {
    return { valid: false, message: `Minimum spending of $${this.customerRestrictions.minimumSpent} required` }
  }

  // Check per-customer usage limit
  if (this.usageRestrictions.perCustomerLimit) {
    const customerUsageCount = this.usageHistory.filter(
      (usage: any) => usage.customerId.toString() === customerId
    ).length

    if (customerUsageCount >= this.usageRestrictions.perCustomerLimit) {
      return { valid: false, message: 'You have already used this discount code' }
    }
  }

  return { valid: true }
}

// Method to record usage
discountSchema.methods.recordUsage = function(customerId: string, bookingId: string, discountAmount: number) {
  this.usedCount += 1
  
  this.usageHistory.push({
    customerId,
    bookingId,
    discountAmount,
    usedAt: new Date()
  })

  return this.save()
}

// Method to check if customer has used this discount
discountSchema.methods.hasCustomerUsed = function(customerId: string): boolean {
  return this.usageHistory.some((usage: any) => usage.customerId.toString() === customerId)
}

// Method to get customer usage count
discountSchema.methods.getCustomerUsageCount = function(customerId: string): number {
  return this.usageHistory.filter((usage: any) => usage.customerId.toString() === customerId).length
}

// Static method to find valid discount by code
discountSchema.statics.findValidByCode = function(code: string) {
  const now = new Date()
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
    ]
  })
}

// Static method to get active discounts
discountSchema.statics.getActiveDiscounts = function() {
  const now = new Date()
  return this.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  }).sort({ createdAt: -1 })
}

// Static method to get expired discounts
discountSchema.statics.getExpiredDiscounts = function() {
  const now = new Date()
  return this.find({
    validUntil: { $lt: now }
  }).sort({ validUntil: -1 })
}

// Static method to get discount statistics
discountSchema.statics.getDiscountStats = function(startDate?: Date, endDate?: Date) {
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
        _id: null,
        totalDiscounts: { $sum: 1 },
        activeDiscounts: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$isActive', true] },
                { $gte: [new Date(), '$validFrom'] },
                { $lte: [new Date(), '$validUntil'] }
              ]},
              1,
              0
            ]
          }
        },
        totalUsage: { $sum: '$usedCount' },
        averageUsage: { $avg: '$usedCount' }
      }
    }
  ])
}

// Static method to get most used discounts
discountSchema.statics.getMostUsedDiscounts = function(limit: number = 10) {
  return this.find()
    .sort({ usedCount: -1 })
    .limit(limit)
    .select('code name type value usedCount usageLimit')
}

// Static method to get discount usage by date range
discountSchema.statics.getUsageByDateRange = function(startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $unwind: '$usageHistory'
    },
    {
      $match: {
        'usageHistory.usedAt': {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$usageHistory.usedAt' },
          month: { $month: '$usageHistory.usedAt' },
          day: { $dayOfMonth: '$usageHistory.usedAt' }
        },
        usageCount: { $sum: 1 },
        totalDiscountAmount: { $sum: '$usageHistory.discountAmount' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ])
}

// Static method to get customer discount history
discountSchema.statics.getCustomerDiscountHistory = function(customerId: string) {
  return this.find({
    'usageHistory.customerId': customerId
  })
    .populate('usageHistory.customerId', 'name email')
    .populate('usageHistory.bookingId', 'serviceName date time')
    .sort({ 'usageHistory.usedAt': -1 })
}

// Static method to get discount performance
discountSchema.statics.getDiscountPerformance = function() {
  return this.aggregate([
    {
      $project: {
        code: 1,
        name: 1,
        type: 1,
        value: 1,
        usedCount: 1,
        usageLimit: 1,
        totalDiscountAmount: {
          $sum: '$usageHistory.discountAmount'
        },
        usageRate: {
          $cond: [
            { $eq: ['$usageLimit', null] },
            null,
            { $divide: ['$usedCount', '$usageLimit'] }
          ]
        }
      }
    },
    { $sort: { usedCount: -1 } }
  ])
}

// Static method to get expiring discounts
discountSchema.statics.getExpiringDiscounts = function(days: number = 7) {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + days)
  
  return this.find({
    isActive: true,
    validUntil: {
      $gte: new Date(),
      $lte: expiryDate
    }
  }).sort({ validUntil: 1 })
}

// Static method to get unused discounts
discountSchema.statics.getUnusedDiscounts = function() {
  return this.find({
    usedCount: 0,
    isActive: true,
    validUntil: { $gte: new Date() }
  }).sort({ createdAt: -1 })
}

// Static method to get discount by service
discountSchema.statics.getDiscountsByService = function(serviceId: string) {
  return this.find({
    isActive: true,
    validUntil: { $gte: new Date() },
    $or: [
      { applicableServices: { $in: [serviceId] } },
      { applicableServices: { $size: 0 } }
    ],
    $and: [
      { excludedServices: { $nin: [serviceId] } }
    ]
  })
}

// Static method to validate discount code
discountSchema.statics.validateCode = async function(code: string, customerId: string, amount: number, serviceId?: string) {
  const discount = await this.findValidByCode(code)
  
  if (!discount) {
    return { valid: false, message: 'Invalid or expired discount code' }
  }

  // Check minimum amount
  if (discount.minimumAmount > amount) {
    return { valid: false, message: `Minimum purchase amount of $${discount.minimumAmount} required` }
  }

  // Check service restrictions
  if (serviceId) {
    if (discount.excludedServices.includes(serviceId)) {
      return { valid: false, message: 'This discount cannot be applied to this service' }
    }
    
    if (discount.applicableServices.length > 0 && !discount.applicableServices.includes(serviceId)) {
      return { valid: false, message: 'This discount is not applicable to this service' }
    }
  }

  // Check customer restrictions
  const customerValidation = await discount.validateForCustomer(customerId)
  if (!customerValidation.valid) {
    return customerValidation
  }

  const discountAmount = discount.calculateDiscount(amount)
  
  return {
    valid: true,
    discount,
    discountAmount,
    finalAmount: amount - discountAmount
  }
}

export default mongoose.models.Discount || mongoose.model('Discount', discountSchema) 