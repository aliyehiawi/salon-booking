import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Customer from '@/models/Customer'
import Booking from '@/models/Booking'
import { verifyTokenString } from '@/lib/auth'

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

    // Get all customers
    const customers = await Customer.find({}).sort({ createdAt: -1 })

    // Get booking statistics for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        // Get customer's bookings
        const customerBookings = await Booking.find({ email: customer.email })
        
        // Calculate total spent
        const totalSpent = customerBookings.reduce((sum, booking) => {
          const price = parseFloat(booking.price.replace(/[^0-9.]/g, ''))
          return sum + price
        }, 0)

        // Get last booking date
        const lastBooking = customerBookings.length > 0 
          ? customerBookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
          : null

        return {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          createdAt: customer.createdAt,
          totalBookings: customerBookings.length,
          totalSpent,
          lastBooking
        }
      })
    )

    return NextResponse.json(customersWithStats)
  } catch (err: any) {
    console.error('Customers API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 