import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import Customer from '@/models/Customer'
import Service from '@/models/Service'
import { verifyTokenString } from '@/lib/auth'
import { startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks, startOfYear, endOfYear, subYears, format, eachDayOfInterval } from 'date-fns'

export async function GET(req: NextRequest) {
  await dbConnect()
  
  try {
    // Verify admin token
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
    const timeRange = searchParams.get('timeRange') || 'month'

    // Calculate date ranges
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (timeRange) {
      case 'week':
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
        break
      case 'month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'year':
        startDate = startOfYear(now)
        endDate = endOfYear(now)
        break
      default:
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
    }

    const previousPeriodStart = subMonths(startDate, 1)
    const previousPeriodEnd = subMonths(endDate, 1)

    // Get all bookings
    const allBookings = await Booking.find({})
    const currentPeriodBookings = await Booking.find({
      date: {
        $gte: startDate.toISOString().split('T')[0],
        $lte: endDate.toISOString().split('T')[0]
      }
    })
    const previousPeriodBookings = await Booking.find({
      date: {
        $gte: previousPeriodStart.toISOString().split('T')[0],
        $lte: previousPeriodEnd.toISOString().split('T')[0]
      }
    })

    // Calculate overview metrics
    const totalBookings = allBookings.length
    const totalRevenue = allBookings.reduce((sum, booking) => {
      const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
      return sum + price
    }, 0)

    const currentPeriodRevenue = currentPeriodBookings.reduce((sum, booking) => {
      const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
      return sum + price
    }, 0)

    const previousPeriodRevenue = previousPeriodBookings.reduce((sum, booking) => {
      const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
      return sum + price
    }, 0)

    // Get customer counts
    const totalCustomers = await Customer.countDocuments()
    const newCustomersThisMonth = await Customer.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    })

    // Calculate average rating (mock data for now)
    const averageRating = 4.5
    const averageRatingThisMonth = 4.6

    // Get recent bookings
    const recentBookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('serviceId', 'name')

    // Get top services
    const serviceStats = await Booking.aggregate([
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
          }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit: 5 }
    ])

    const topServices = await Promise.all(
      serviceStats.map(async (stat) => {
        const service = await Service.findById(stat._id)
        return {
          name: service?.name || 'Unknown Service',
          bookings: stat.bookings,
          revenue: stat.revenue
        }
      })
    )

    // Generate booking trends
    const trendDays = eachDayOfInterval({ start: startDate, end: endDate })
    const bookingTrends = trendDays.map(day => {
      const dayBookings = currentPeriodBookings.filter(booking => {
        const bookingDate = new Date(booking.date)
        return bookingDate.toDateString() === day.toDateString()
      })
      
      const dayRevenue = dayBookings.reduce((sum, booking) => {
        const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
        return sum + price
      }, 0)

      return {
        date: format(day, 'yyyy-MM-dd'),
        bookings: dayBookings.length,
        revenue: dayRevenue
      }
    })

    // Calculate status distribution
    const statusDistribution = {
      confirmed: currentPeriodBookings.filter(b => b.status === 'confirmed').length,
      pending: currentPeriodBookings.filter(b => b.status === 'pending').length,
      cancelled: currentPeriodBookings.filter(b => b.status === 'cancelled').length,
      completed: currentPeriodBookings.filter(b => b.status === 'completed').length
    }

    // Generate monthly stats for the last 6 months
    const monthlyStats = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(subMonths(now, i))
      
      const monthBookings = await Booking.find({
        date: {
          $gte: monthStart.toISOString().split('T')[0],
          $lte: monthEnd.toISOString().split('T')[0]
        }
      })

      const monthRevenue = monthBookings.reduce((sum, booking) => {
        const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
        return sum + price
      }, 0)

      const monthCustomers = await Customer.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd }
      })

      monthlyStats.push({
        month: format(monthStart, 'MMM yyyy'),
        bookings: monthBookings.length,
        revenue: monthRevenue,
        customers: monthCustomers
      }
    )
    }

    const dashboardData = {
      overview: {
        totalBookings,
        totalRevenue,
        totalCustomers,
        averageRating,
        bookingsThisMonth: currentPeriodBookings.length,
        revenueThisMonth: currentPeriodRevenue,
        newCustomersThisMonth,
        averageRatingThisMonth
      },
      recentBookings: recentBookings.map(booking => ({
        _id: booking._id,
        name: booking.name,
        serviceName: (booking.serviceId as any)?.name || 'Unknown Service',
        date: booking.date,
        time: booking.time,
        status: booking.status,
        price: booking.price
      })),
      topServices,
      bookingTrends,
      statusDistribution,
      monthlyStats
    }

    return NextResponse.json(dashboardData)
  } catch (err: any) {
    console.error('Dashboard API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 