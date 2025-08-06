import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Review from '@/models/Review'
import Booking from '@/models/Booking'
import { verifyTokenString } from '@/lib/auth'
import { authRateLimiter, addRateLimitHeaders, createRateLimitError } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimit = await authRateLimiter.check(req)
  if (!rateLimit.allowed) {
    return createRateLimitError(rateLimit.resetTime)
  }

  await dbConnect()
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'customer') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { bookingId, rating, title, comment } = await req.json()
    
    // Validation
    if (!bookingId || !rating || !title || !comment) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    if (title.length > 100) {
      return NextResponse.json({ error: 'Title must be 100 characters or less' }, { status: 400 })
    }

    if (comment.length > 1000) {
      return NextResponse.json({ error: 'Comment must be 1000 characters or less' }, { status: 400 })
    }

    // Check if booking exists and belongs to customer
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.email !== decoded.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if booking is completed (status should be 'completed' or similar)
    if (booking.status !== 'completed') {
      return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 })
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId })
    if (existingReview) {
      return NextResponse.json({ error: 'Review already exists for this booking' }, { status: 409 })
    }

    // Create review
    const review = new Review({
      bookingId,
      customerId: decoded.id,
      serviceId: booking.serviceId,
      rating,
      title: title.trim(),
      comment: comment.trim()
    })

    await review.save()

    const response = NextResponse.json({ 
      message: 'Review submitted successfully',
      review: {
        id: review._id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        createdAt: review.createdAt
      }
    }, { status: 201 })

    return addRateLimitHeaders(response, rateLimit.remaining, rateLimit.resetTime)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  await dbConnect()
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'customer') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const serviceId = searchParams.get('serviceId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (serviceId) {
      // Get reviews for a specific service
      const reviews = await Review.getServiceReviews(serviceId, page, limit)
      const totalReviews = await Review.countDocuments({ serviceId, isPublic: true })
      
      return NextResponse.json({
        reviews,
        pagination: {
          page,
          limit,
          total: totalReviews,
          pages: Math.ceil(totalReviews / limit)
        }
      })
    } else {
      // Get customer's own reviews
      const reviews = await Review.getCustomerReviews(decoded.id)
      return NextResponse.json(reviews)
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 