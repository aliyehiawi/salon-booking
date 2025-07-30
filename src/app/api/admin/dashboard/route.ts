import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Booking from '@/models/Booking'
import Customer from '@/models/Customer'
import Service from '@/models/Service'
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

    // Get current month for monthly calculations
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const startOfMonth = new Date(currentYear, currentMonth, 1)
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0)

    // Fetch all bookings with service details
    const bookings = await Booking.find()
      .populate('serviceId', 'name price')
      .sort({ createdAt: -1 })

    // Calculate total revenue
    const totalRevenue = bookings.reduce((sum, booking) => {
      const price = booking.serviceId?.price || '0'
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0
      return sum + numericPrice
    }, 0)

    // Calculate monthly revenue
    const monthlyBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date)
      return bookingDate >= startOfMonth && bookingDate <= endOfMonth
    })

    const monthlyRevenue = monthlyBookings.reduce((sum, booking) => {
      const price = booking.serviceId?.price || '0'
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0
      return sum + numericPrice
    }, 0)

    // Count bookings by status
    const pendingBookings = bookings.filter(b => b.status === 'pending').length
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length

    // Get unique customers count
    const uniqueCustomers = new Set(bookings.map(b => b.email)).size

    // Calculate popular services
    const serviceStats = new Map()
    bookings.forEach(booking => {
      const serviceName = booking.serviceId?.name || 'Unknown Service'
      const price = booking.serviceId?.price || '0'
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0
      
      if (serviceStats.has(serviceName)) {
        const stats = serviceStats.get(serviceName)
        stats.count += 1
        stats.revenue += numericPrice
      } else {
        serviceStats.set(serviceName, { count: 1, revenue: numericPrice })
      }
    })

    const popularServices = Array.from(serviceStats.entries())
      .map(([name, stats]: [string, any]) => ({
        name,
        count: stats.count,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Get recent bookings (last 10)
    const recentBookings = bookings.slice(0, 10).map(booking => ({
      _id: booking._id,
      name: booking.name,
      serviceName: booking.serviceId?.name || 'Unknown Service',
      date: booking.date,
      time: booking.time,
      status: booking.status,
      price: booking.serviceId?.price || '$0'
    }))

    // Calculate average rating (placeholder - you can add rating field to bookings later)
    const averageRating = 4.5 // Placeholder

    const dashboardData = {
      totalBookings: bookings.length,
      totalRevenue,
      totalCustomers: uniqueCustomers,
      averageRating,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      monthlyRevenue,
      popularServices,
      recentBookings
    }

    return NextResponse.json(dashboardData)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 