import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Customer from '@/models/Customer'
import Booking from '@/models/Booking'
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

    // Fetch all customers
    const customers = await Customer.find().select('-password').sort({ createdAt: -1 })

    // Fetch all bookings to calculate statistics
    const bookings = await Booking.find().populate('serviceId', 'price')

    // Calculate booking statistics for each customer
    const customersWithStats = customers.map(customer => {
      const customerBookings = bookings.filter(booking => booking.email === customer.email)
      const bookingCount = customerBookings.length
      
      const totalSpent = customerBookings.reduce((sum, booking) => {
        const price = booking.serviceId?.price || '0'
        const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0
        return sum + numericPrice
      }, 0)

      return {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt,
        preferences: customer.preferences,
        bookingCount,
        totalSpent
      }
    })

    return NextResponse.json(customersWithStats)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 