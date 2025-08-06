import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
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
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  reportedCount: {
    type: Number,
    default: 0
  },
  adminResponse: {
    text: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser'
    }
  }
}, {
  timestamps: true
})

// Prevent multiple reviews per booking
reviewSchema.index({ bookingId: 1 }, { unique: true })

// Index for efficient queries
reviewSchema.index({ serviceId: 1, isPublic: 1, createdAt: -1 })
reviewSchema.index({ customerId: 1, createdAt: -1 })
reviewSchema.index({ rating: 1, serviceId: 1 })

// Static method to get average rating for a service
reviewSchema.statics.getAverageRating = function(serviceId: string) {
  return this.aggregate([
    { $match: { serviceId: new mongoose.Types.ObjectId(serviceId), isPublic: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ])
}

// Static method to get reviews for a service with pagination
reviewSchema.statics.getServiceReviews = function(serviceId: string, page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit
  return this.find({ serviceId, isPublic: true })
    .populate('customerId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
}

// Static method to get customer's reviews
reviewSchema.statics.getCustomerReviews = function(customerId: string) {
  return this.find({ customerId })
    .populate('serviceId', 'name')
    .populate('bookingId', 'date time')
    .sort({ createdAt: -1 })
}

// Static method to get recent reviews for admin dashboard
reviewSchema.statics.getRecentReviews = function(limit: number = 10) {
  return this.find()
    .populate('customerId', 'name email')
    .populate('serviceId', 'name')
    .populate('bookingId', 'date time')
    .sort({ createdAt: -1 })
    .limit(limit)
}

// Static method to get review statistics
reviewSchema.statics.getReviewStats = function() {
  return this.aggregate([
    { $match: { isPublic: true } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ])
}

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema)
export default Review 