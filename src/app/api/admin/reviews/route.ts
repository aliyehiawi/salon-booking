import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Review from '@/models/Review'
import { verifyTokenString } from '@/lib/auth'

export async function GET(req: NextRequest) {
  await dbConnect()
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // 'all', 'pending', 'approved', 'rejected'
    const serviceId = searchParams.get('serviceId')
    const rating = searchParams.get('rating')

    let query: any = {}
    
    if (status && status !== 'all') {
      if (status === 'pending') {
        query.isPublic = false
      } else if (status === 'approved') {
        query.isPublic = true
      }
    }

    if (serviceId) {
      query.serviceId = serviceId
    }

    if (rating) {
      query.rating = parseInt(rating)
    }

    const skip = (page - 1) * limit
    
    const reviews = await Review.find(query)
      .populate('customerId', 'name email')
      .populate('serviceId', 'name')
      .populate('bookingId', 'date time')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalReviews = await Review.countDocuments(query)
    const reviewStats = await Review.getReviewStats()

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total: totalReviews,
        pages: Math.ceil(totalReviews / limit)
      },
      stats: reviewStats[0] || {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: []
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  await dbConnect()
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { reviewId, action, adminResponse } = await req.json()
    
    if (!reviewId || !action) {
      return NextResponse.json({ error: 'Review ID and action are required' }, { status: 400 })
    }

    const review = await Review.findById(reviewId)
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    switch (action) {
      case 'approve':
        review.isPublic = true
        review.isVerified = true
        break
      case 'reject':
        review.isPublic = false
        break
      case 'respond':
        if (!adminResponse) {
          return NextResponse.json({ error: 'Admin response is required' }, { status: 400 })
        }
        review.adminResponse = {
          text: adminResponse,
          respondedAt: new Date(),
          respondedBy: decoded.id
        }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    await review.save()

    return NextResponse.json({ 
      message: 'Review updated successfully',
      review
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect()
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reviewId = searchParams.get('id')
    
    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 })
    }

    const review = await Review.findByIdAndDelete(reviewId)
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Review deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 