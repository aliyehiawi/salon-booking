import mongoose from 'mongoose'

// Badge definitions
export const BADGES = {
  FIRST_BOOKING: {
    name: 'First Timer',
    description: 'Completed your first booking',
    icon: '🎉',
    category: 'milestone'
  },
  REGULAR_CUSTOMER: {
    name: 'Regular',
    description: 'Completed 5 bookings',
    icon: '⭐',
    category: 'milestone'
  },
  LOYAL_CUSTOMER: {
    name: 'Loyal',
    description: 'Completed 10 bookings',
    icon: '💎',
    category: 'milestone'
  },
  BIG_SPENDER: {
    name: 'Big Spender',
    description: 'Spent over $500',
    icon: '💰',
    category: 'spending'
  },
  SILVER_TIER: {
    name: 'Silver Member',
    description: 'Achieved Silver tier',
    icon: '🥈',
    category: 'tier'
  },
  GOLD_TIER: {
    name: 'Gold Member',
    description: 'Achieved Gold tier',
    icon: '🥇',
    category: 'tier'
  },
  PLATINUM_TIER: {
    name: 'Platinum Member',
    description: 'Achieved Platinum tier',
    icon: '💎',
    category: 'tier'
  },
  DIAMOND_TIER: {
    name: 'Diamond Member',
    description: 'Achieved Diamond tier',
    icon: '👑',
    category: 'tier'
  }
}

// Tier thresholds
export const TIER_THRESHOLDS = {
  bronze: { minBookings: 0, minSpent: 0 },
  silver: { minBookings: 5, minSpent: 200 },
  gold: { minBookings: 15, minSpent: 500 },
  platinum: { minBookings: 30, minSpent: 1000 },
  diamond: { minBookings: 50, minSpent: 2000 }
}

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
  badges: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['milestone', 'spending', 'tier'],
      required: true
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  milestones: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['bookings', 'spending'],
      required: true
    },
    threshold: {
      type: Number,
      required: true
    },
    reward: {
      type: String,
      enum: ['points', 'discount'],
      required: true
    },
    rewardValue: {
      type: Number,
      required: true
    },
    achievedAt: {
      type: Date,
      default: Date.now
    },
    isRedeemed: {
      type: Boolean,
      default: false
    }
  }],
  activeDiscounts: [{
    code: {
      type: String,
      required: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isUsed: {
      type: Boolean,
      default: false
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
// customerId field already has unique: true in schema definition
customerLoyaltySchema.index({ tier: 1 })
customerLoyaltySchema.index({ totalSpent: -1 })
customerLoyaltySchema.index({ totalBookings: -1 })

export default mongoose.models.CustomerLoyalty || mongoose.model('CustomerLoyalty', customerLoyaltySchema) 