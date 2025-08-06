import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import Customer from '@/models/Customer'
import Service from '@/models/Service'
import Review from '@/models/Review'
import Payment from '@/models/Payment'
import { verifyTokenString } from '@/lib/auth'
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, format, eachDayOfInterval, subDays } from 'date-fns'

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
    const reportType = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const serviceId = searchParams.get('serviceId')

    const start = startDate ? new Date(startDate) : startOfMonth(new Date())
    const end = endDate ? new Date(endDate) : endOfMonth(new Date())

    switch (reportType) {
      case 'financial':
        return await getFinancialReport(start, end)
      case 'bookings':
        return await getBookingsReport(start, end, serviceId)
      case 'customers':
        return await getCustomersReport(start, end)
      case 'services':
        return await getServicesReport(start, end)
      case 'reviews':
        return await getReviewsReport(start, end)
      case 'performance':
        return await getPerformanceReport(start, end)
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function getFinancialReport(startDate: Date, endDate: Date) {
  // Get all bookings in date range
  const bookings = await Booking.find({
    date: {
      $gte: startDate.toISOString().split('T')[0],
      $lte: endDate.toISOString().split('T')[0]
    }
  })

  // Calculate revenue metrics
  const totalRevenue = bookings.reduce((sum, booking) => {
    const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
    return sum + price
  }, 0)

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed')
  const confirmedRevenue = confirmedBookings.reduce((sum, booking) => {
    const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
    return sum + price
  }, 0)

  const cancelledBookings = bookings.filter(b => b.status === 'cancelled')
  const cancelledRevenue = cancelledBookings.reduce((sum, booking) => {
    const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
    return sum + price
  }, 0)

  // Daily revenue breakdown
  const dailyRevenue = eachDayOfInterval({ start: startDate, end: endDate }).map(day => {
    const dayBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date)
      return bookingDate.toDateString() === day.toDateString()
    })
    
    const dayRevenue = dayBookings.reduce((sum, booking) => {
      const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
      return sum + price
    }, 0)

    return {
      date: format(day, 'yyyy-MM-dd'),
      revenue: dayRevenue,
      bookings: dayBookings.length
    }
  })

  // Payment method analysis
  const payments = await Payment.find({
    createdAt: { $gte: startDate, $lte: endDate },
    status: 'succeeded'
  })

  const paymentMethods = payments.reduce((acc, payment) => {
    const method = payment.paymentMethod || 'unknown'
    acc[method] = (acc[method] || 0) + payment.amount
    return acc
  }, {} as Record<string, number>)

  return NextResponse.json({
    summary: {
      totalRevenue,
      confirmedRevenue,
      cancelledRevenue,
      totalBookings: bookings.length,
      confirmedBookings: confirmedBookings.length,
      cancelledBookings: cancelledBookings.length,
      averageBookingValue: bookings.length > 0 ? totalRevenue / bookings.length : 0
    },
    dailyRevenue,
    paymentMethods,
    dateRange: {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd')
    }
  })
}

async function getBookingsReport(startDate: Date, endDate: Date, serviceId?: string | null) {
  let query: any = {
    date: {
      $gte: startDate.toISOString().split('T')[0],
      $lte: endDate.toISOString().split('T')[0]
    }
  }

  if (serviceId) {
    query.serviceId = serviceId
  }

  const bookings = await Booking.find(query).populate('serviceId', 'name')

  // Status breakdown
  const statusBreakdown = bookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Service breakdown
  const serviceBreakdown = bookings.reduce((acc, booking) => {
    const serviceName = (booking.serviceId as any)?.name || 'Unknown'
    acc[serviceName] = (acc[serviceName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Time slot analysis
  const timeSlotAnalysis = bookings.reduce((acc, booking) => {
    acc[booking.time] = (acc[booking.time] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Daily booking trends
  const dailyBookings = eachDayOfInterval({ start: startDate, end: endDate }).map(day => {
    const dayBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date)
      return bookingDate.toDateString() === day.toDateString()
    })

    return {
      date: format(day, 'yyyy-MM-dd'),
      bookings: dayBookings.length,
      revenue: dayBookings.reduce((sum, booking) => {
        const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
        return sum + price
      }, 0)
    }
  })

  return NextResponse.json({
    summary: {
      totalBookings: bookings.length,
      statusBreakdown,
      serviceBreakdown,
      timeSlotAnalysis
    },
    dailyBookings,
    dateRange: {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd')
    }
  })
}

async function getCustomersReport(startDate: Date, endDate: Date) {
  // New customers in date range
  const newCustomers = await Customer.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate }
  })

  // Total customers
  const totalCustomers = await Customer.countDocuments()

  // Customer booking analysis
  const customerBookings = await Booking.aggregate([
    {
      $match: {
        date: {
          $gte: startDate.toISOString().split('T')[0],
          $lte: endDate.toISOString().split('T')[0]
        }
      }
    },
    {
      $group: {
        _id: '$email',
        bookings: { $sum: 1 },
        totalSpent: {
          $sum: {
            $toDouble: {
              $replaceAll: {
                input: '$price',
                find: '$',
                replacement: ''
              }
            }
          }
        }
      }
    },
    { $sort: { totalSpent: -1 } }
  ])

  // Customer segments
  const customerSegments = {
    new: customerBookings.filter(c => c.bookings === 1).length,
    returning: customerBookings.filter(c => c.bookings > 1 && c.bookings <= 5).length,
    loyal: customerBookings.filter(c => c.bookings > 5).length
  }

  // Top customers
  const topCustomers = customerBookings.slice(0, 10)

  return NextResponse.json({
    summary: {
      totalCustomers,
      newCustomers,
      customerSegments,
      averageBookingsPerCustomer: customerBookings.length > 0 
        ? customerBookings.reduce((sum, c) => sum + c.bookings, 0) / customerBookings.length 
        : 0
    },
    topCustomers,
    dateRange: {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd')
    }
  })
}

async function getServicesReport(startDate: Date, endDate: Date) {
  const bookings = await Booking.find({
    date: {
      $gte: startDate.toISOString().split('T')[0],
      $lte: endDate.toISOString().split('T')[0]
    }
  }).populate('serviceId', 'name description duration')

  // Service performance
  const servicePerformance = await Booking.aggregate([
    {
      $match: {
        date: {
          $gte: startDate.toISOString().split('T')[0],
          $lte: endDate.toISOString().split('T')[0]
        }
      }
    },
    {
      $group: {
        _id: '$serviceId',
        bookings: { $sum: 1 },
        revenue: {
          $sum: {
            $toDouble: {
              $replaceAll: {
                input: '$price',
                find: '$',
                replacement: ''
              }
            }
          }
        },
        confirmedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    },
    { $sort: { bookings: -1 } }
  ])

  // Get service details
  const serviceDetails = await Promise.all(
    servicePerformance.map(async (service) => {
      const serviceInfo = await Service.findById(service._id)
      return {
        ...service,
        serviceName: serviceInfo?.name || 'Unknown Service',
        description: serviceInfo?.description || '',
        duration: serviceInfo?.duration || ''
      }
    })
  )

  return NextResponse.json({
    services: serviceDetails,
    summary: {
      totalServices: serviceDetails.length,
      totalBookings: serviceDetails.reduce((sum, s) => sum + s.bookings, 0),
      totalRevenue: serviceDetails.reduce((sum, s) => sum + s.revenue, 0)
    },
    dateRange: {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd')
    }
  })
}

async function getReviewsReport(startDate: Date, endDate: Date) {
  const reviews = await Review.find({
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('serviceId', 'name').populate('customerId', 'name')

  // Rating distribution
  const ratingDistribution = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  // Average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  // Service rating breakdown
  const serviceRatings = await Review.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        isPublic: true
      }
    },
    {
      $group: {
        _id: '$serviceId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    },
    { $sort: { averageRating: -1 } }
  ])

  // Get service names
  const serviceRatingDetails = await Promise.all(
    serviceRatings.map(async (service) => {
      const serviceInfo = await Service.findById(service._id)
      return {
        ...service,
        serviceName: serviceInfo?.name || 'Unknown Service'
      }
    })
  )

  return NextResponse.json({
    summary: {
      totalReviews: reviews.length,
      averageRating,
      ratingDistribution
    },
    serviceRatings: serviceRatingDetails,
    recentReviews: reviews.slice(0, 10),
    dateRange: {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd')
    }
  })
}

async function getPerformanceReport(startDate: Date, endDate: Date) {
  // Get current period data
  const currentBookings = await Booking.find({
    date: {
      $gte: startDate.toISOString().split('T')[0],
      $lte: endDate.toISOString().split('T')[0]
    }
  })

  // Get previous period data (same duration)
  const duration = endDate.getTime() - startDate.getTime()
  const previousStart = new Date(startDate.getTime() - duration)
  const previousEnd = new Date(startDate.getTime() - 1)

  const previousBookings = await Booking.find({
    date: {
      $gte: previousStart.toISOString().split('T')[0],
      $lte: previousEnd.toISOString().split('T')[0]
    }
  })

  // Calculate metrics
  const currentRevenue = currentBookings.reduce((sum, booking) => {
    const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
    return sum + price
  }, 0)

  const previousRevenue = previousBookings.reduce((sum, booking) => {
    const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
    return sum + price
  }, 0)

  const revenueGrowth = previousRevenue > 0 
    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
    : 0

  const bookingGrowth = previousBookings.length > 0 
    ? ((currentBookings.length - previousBookings.length) / previousBookings.length) * 100 
    : 0

  // Customer retention
  const currentCustomers = [...new Set(currentBookings.map(b => b.email))]
  const previousCustomers = [...new Set(previousBookings.map(b => b.email))]
  const retainedCustomers = currentCustomers.filter(email => previousCustomers.includes(email))
  const retentionRate = previousCustomers.length > 0 
    ? (retainedCustomers.length / previousCustomers.length) * 100 
    : 0

  return NextResponse.json({
    currentPeriod: {
      bookings: currentBookings.length,
      revenue: currentRevenue,
      customers: currentCustomers.length
    },
    previousPeriod: {
      bookings: previousBookings.length,
      revenue: previousRevenue,
      customers: previousCustomers.length
    },
    growth: {
      revenueGrowth,
      bookingGrowth,
      retentionRate
    },
    dateRange: {
      current: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd')
      },
      previous: {
        start: format(previousStart, 'yyyy-MM-dd'),
        end: format(previousEnd, 'yyyy-MM-dd')
      }
    }
  })
} 