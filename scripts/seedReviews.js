const mongoose = require('mongoose')
require('dotenv').config()

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-booking')

// Import models
const Review = require('../src/models/Review')
const Booking = require('../src/models/Booking')
const Customer = require('../src/models/Customer')
const Service = require('../src/models/Service')

const sampleReviews = [
  {
    rating: 5,
    title: "Excellent service!",
    comment: "The stylist was very professional and did exactly what I wanted. The salon is clean and welcoming. Highly recommend!",
    isVerified: true,
    isPublic: true,
    helpfulCount: 3
  },
  {
    rating: 4,
    title: "Great haircut",
    comment: "Really happy with my haircut. The stylist listened to what I wanted and delivered. Will definitely come back.",
    isVerified: true,
    isPublic: true,
    helpfulCount: 1
  },
  {
    rating: 5,
    title: "Amazing experience",
    comment: "First time visiting this salon and I'm impressed. The staff is friendly, the service is top-notch, and the prices are reasonable.",
    isVerified: true,
    isPublic: true,
    helpfulCount: 2
  },
  {
    rating: 4,
    title: "Good service",
    comment: "The stylist was skilled and the salon has a nice atmosphere. Would recommend to friends and family.",
    isVerified: true,
    isPublic: true,
    helpfulCount: 0
  },
  {
    rating: 5,
    title: "Perfect styling",
    comment: "I love how my hair turned out! The stylist really knows what they're doing. The salon is also very clean and modern.",
    isVerified: true,
    isPublic: true,
    helpfulCount: 4
  }
]

async function seedReviews() {
  try {
    console.log('🌱 Seeding reviews...')

    // Get some existing bookings, customers, and services
    const bookings = await Booking.find({ status: 'completed' }).limit(5)
    const customers = await Customer.find().limit(5)
    const services = await Service.find().limit(5)

    if (bookings.length === 0) {
      console.log('❌ No completed bookings found. Please create some bookings first.')
      return
    }

    if (customers.length === 0) {
      console.log('❌ No customers found. Please create some customers first.')
      return
    }

    if (services.length === 0) {
      console.log('❌ No services found. Please create some services first.')
      return
    }

    // Clear existing reviews
    await Review.deleteMany({})
    console.log('🗑️  Cleared existing reviews')

    // Create reviews
    const reviews = []
    for (let i = 0; i < Math.min(bookings.length, sampleReviews.length); i++) {
      const booking = bookings[i]
      const customer = customers[i % customers.length]
      const service = services[i % services.length]
      const sampleReview = sampleReviews[i]

      const review = new Review({
        bookingId: booking._id,
        customerId: customer._id,
        serviceId: service._id,
        rating: sampleReview.rating,
        title: sampleReview.title,
        comment: sampleReview.comment,
        isVerified: sampleReview.isVerified,
        isPublic: sampleReview.isPublic,
        helpfulCount: sampleReview.helpfulCount,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      })

      reviews.push(review)
    }

    await Review.insertMany(reviews)
    console.log(`✅ Created ${reviews.length} reviews`)

    // Update booking status to completed if not already
    for (const booking of bookings) {
      if (booking.status !== 'completed') {
        booking.status = 'completed'
        await booking.save()
      }
    }

    console.log('🎉 Reviews seeded successfully!')
    console.log('\n📊 Review Statistics:')
    
    const totalReviews = await Review.countDocuments()
    const avgRating = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ])
    
    console.log(`Total Reviews: ${totalReviews}`)
    console.log(`Average Rating: ${avgRating[0]?.avgRating?.toFixed(1) || 0}/5`)

  } catch (error) {
    console.error('❌ Error seeding reviews:', error)
  } finally {
    mongoose.connection.close()
  }
}

seedReviews() 