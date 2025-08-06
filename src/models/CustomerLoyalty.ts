import mongoose from 'mongoose'

// Badge definitions
export const BADGES = {
  FIRST_BOOKING: {
    name: 'First Booking',
    description: 'Completed your first appointment',
    icon: '🎉',
    category: 'milestone'
  },
  REGULAR_CUSTOMER: {
    name: 'Regular Customer',
    description: 'Completed 5 appointments',
    icon: '⭐',
    category: 'loyalty'
  },
  LOYAL_CUSTOMER: {
    name: 'Loyal Customer',
    description: 'Completed 10 appointments',
    icon: '💎',
    category: 'loyalty'
  },
  BIG_SPENDER: {
    name: 'Big Spender',
    description: 'Spent over $500',
    icon: '💰',
    category: 'spending'
  },
  SILVER_TIER: {
    name: 'Silver Tier',
    description: 'Reached Silver tier status',
    icon: '🥈',
    category: 'tier'
  },
  GOLD_TIER: {
    name: 'Gold Tier',
    description: 'Reached Gold tier status',
    icon: '🥇',
    category: 'tier'
  },
  PLATINUM_TIER: {
    name: 'Platinum Tier',
    description: 'Reached Platinum tier status',
    icon: '💎',
    category: 'tier'
  },
  DIAMOND_TIER: {
    name: 'Diamond Tier',
    description: 'Reached Diamond tier status',
    icon: '👑',
    category: 'tier'
  }
}

// Tier thresholds
export const TIER_THRESHOLDS = {
  bronze: { minBookings: 0, minSpent: 0 },
  silver: { minBookings: 5, minSpent: 100 },
  gold: { minBookings: 10, minSpent: 250 },
  platinum: { minBookings: 25, minSpent: 500 },
  diamond: { minBookings: 50, minSpent: 1000 }
}

// Badge schema
const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  category: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now }
})

// Milestone schema
const milestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // 'bookings' or 'spending'
  threshold: { type: Number, required: true },
  reward: { type: String, required: true }, // 'points' or 'discount'
  rewardValue: { type: Number, required: true },
  achievedAt: { type: Date, default: Date.now },
  isRedeemed: { type: Boolean, default: false }
})

// Active discount schema
const activeDiscountSchema = new mongoose.Schema({
  code: { type: String, required: true },
  discountType: { type: String, required: true }, // 'percentage' or 'fixed'
  value: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
  isUsed: { type: Boolean, default: false }
})

// Main loyalty schema
const customerLoyaltySchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    unique: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  totalBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  badges: [badgeSchema],
  milestones: [milestoneSchema],
  activeDiscounts: [activeDiscountSchema],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false }
  }
}, {
  timestamps: true
})

// Index for efficient queries
customerLoyaltySchema.index({ customerId: 1 })
customerLoyaltySchema.index({ tier: 1 })
customerLoyaltySchema.index({ points: -1 })

// Virtual for tier benefits
customerLoyaltySchema.virtual('tierBenefits').get(function() {
  const benefits = {
    bronze: {
      pointsMultiplier: 1,
      discountPercentage: 0,
      priorityBooking: false,
      exclusiveOffers: false
    },
    silver: {
      pointsMultiplier: 1.1,
      discountPercentage: 5,
      priorityBooking: false,
      exclusiveOffers: false
    },
    gold: {
      pointsMultiplier: 1.25,
      discountPercentage: 10,
      priorityBooking: true,
      exclusiveOffers: false
    },
    platinum: {
      pointsMultiplier: 1.5,
      discountPercentage: 15,
      priorityBooking: true,
      exclusiveOffers: true
    },
    diamond: {
      pointsMultiplier: 2,
      discountPercentage: 20,
      priorityBooking: true,
      exclusiveOffers: true
    }
  }
  
  return benefits[this.tier as keyof typeof benefits] || benefits.bronze
})

// Method to calculate tier based on bookings and spending
customerLoyaltySchema.methods.calculateTier = function(): string {
  if (this.totalBookings >= TIER_THRESHOLDS.diamond.minBookings && 
      this.totalSpent >= TIER_THRESHOLDS.diamond.minSpent) {
    return 'diamond'
  } else if (this.totalBookings >= TIER_THRESHOLDS.platinum.minBookings && 
             this.totalSpent >= TIER_THRESHOLDS.platinum.minSpent) {
    return 'platinum'
  } else if (this.totalBookings >= TIER_THRESHOLDS.gold.minBookings && 
             this.totalSpent >= TIER_THRESHOLDS.gold.minSpent) {
    return 'gold'
  } else if (this.totalBookings >= TIER_THRESHOLDS.silver.minBookings && 
             this.totalSpent >= TIER_THRESHOLDS.silver.minSpent) {
    return 'silver'
  } else {
    return 'bronze'
  }
}

// Method to check for new badges
customerLoyaltySchema.methods.checkForNewBadges = function() {
  const newBadges = []
  const existingBadgeNames = this.badges.map((b: any) => b.name)

  // First booking badge
  if (this.totalBookings === 1 && !existingBadgeNames.includes(BADGES.FIRST_BOOKING.name)) {
    newBadges.push(BADGES.FIRST_BOOKING)
  }

  // Regular customer badge
  if (this.totalBookings === 5 && !existingBadgeNames.includes(BADGES.REGULAR_CUSTOMER.name)) {
    newBadges.push(BADGES.REGULAR_CUSTOMER)
  }

  // Loyal customer badge
  if (this.totalBookings === 10 && !existingBadgeNames.includes(BADGES.LOYAL_CUSTOMER.name)) {
    newBadges.push(BADGES.LOYAL_CUSTOMER)
  }

  // Big spender badge
  if (this.totalSpent >= 500 && !existingBadgeNames.includes(BADGES.BIG_SPENDER.name)) {
    newBadges.push(BADGES.BIG_SPENDER)
  }

  // Tier badges
  const tier = this.calculateTier()
  if (tier === 'silver' && !existingBadgeNames.includes(BADGES.SILVER_TIER.name)) {
    newBadges.push(BADGES.SILVER_TIER)
  } else if (tier === 'gold' && !existingBadgeNames.includes(BADGES.GOLD_TIER.name)) {
    newBadges.push(BADGES.GOLD_TIER)
  } else if (tier === 'platinum' && !existingBadgeNames.includes(BADGES.PLATINUM_TIER.name)) {
    newBadges.push(BADGES.PLATINUM_TIER)
  } else if (tier === 'diamond' && !existingBadgeNames.includes(BADGES.DIAMOND_TIER.name)) {
    newBadges.push(BADGES.DIAMOND_TIER)
  }

  return newBadges
}

// Method to check for new milestones
customerLoyaltySchema.methods.checkForNewMilestones = function() {
  const newMilestones = []
  const existingMilestoneNames = this.milestones.map((m: any) => m.name)

  // Booking milestones
  const bookingMilestones = [5, 10, 25, 50, 100]
  bookingMilestones.forEach(threshold => {
    if (this.totalBookings === threshold && !existingMilestoneNames.includes(`${threshold} Bookings`)) {
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
    if (this.totalSpent >= threshold && !existingMilestoneNames.includes(`$${threshold} Spent`)) {
      newMilestones.push({
        name: `$${threshold} Spent`,
        type: 'spending',
        threshold: threshold,
        reward: 'discount',
        rewardValue: Math.min(threshold * 0.05, 50), // 5% discount, max $50
        achievedAt: new Date(),
        isRedeemed: false
      })
    }
  })

  return newMilestones
}

// Method to add points
customerLoyaltySchema.methods.addPoints = function(amount: number, bookingAmount?: number) {
  const benefits = this.tierBenefits
  const pointsEarned = Math.floor(amount * benefits.pointsMultiplier)
  
  this.points += pointsEarned
  if (bookingAmount) {
    this.totalSpent += bookingAmount
  }
  this.totalBookings += 1
  this.lastActivity = new Date()

  // Check for tier upgrade
  const newTier = this.calculateTier()
  if (newTier !== this.tier) {
    this.tier = newTier
  }

  // Check for new badges and milestones
  const newBadges = this.checkForNewBadges()
  const newMilestones = this.checkForNewMilestones()

  this.badges.push(...newBadges)
  this.milestones.push(...newMilestones)

  return {
    pointsEarned,
    newTier,
    newBadges,
    newMilestones
  }
}

// Method to redeem points
customerLoyaltySchema.methods.redeemPoints = function(pointsToRedeem: number) {
  if (pointsToRedeem > this.points) {
    throw new Error('Insufficient points')
  }

  this.points -= pointsToRedeem
  return Math.floor(pointsToRedeem / 100) // $1 discount per 100 points
}

// Method to redeem milestone
customerLoyaltySchema.methods.redeemMilestone = function(milestoneName: string) {
  const milestone = this.milestones.find((m: any) => m.name === milestoneName && !m.isRedeemed)
  if (!milestone) {
    throw new Error('Milestone not found or already redeemed')
  }

  milestone.isRedeemed = true
  return milestone
}

// Static method to get top customers
customerLoyaltySchema.statics.getTopCustomers = function(limit = 10) {
  return this.find()
    .sort({ points: -1, totalSpent: -1 })
    .limit(limit)
    .populate('customerId', 'name email')
}

// Static method to get customers by tier
customerLoyaltySchema.statics.getCustomersByTier = function(tier: string) {
  return this.find({ tier })
    .populate('customerId', 'name email')
}

export default mongoose.models.CustomerLoyalty || mongoose.model('CustomerLoyalty', customerLoyaltySchema) 