import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import SalonInfo from '@/models/SalonInfo'

export async function GET(req: NextRequest) {
  await dbConnect()

  try {
    // Get active salon info
    const salonInfo = await SalonInfo.findOne({ isActive: true })

    if (!salonInfo) {
      // Return default salon info if none exists
      return NextResponse.json({
        name: 'Bliss Hair Studio',
        description: 'Professional hair care services in a relaxing atmosphere.',
        phone: '(555) 123-4567',
        email: 'hello@blisshairstudio.com',
        address: {
          street: '123 Beauty St',
          city: 'Salon City',
          state: 'SC',
          zipCode: '12345',
          country: 'USA'
        },
        socialMedia: {},
        businessHours: {
          monday: { open: '09:00', close: '19:00', closed: false },
          tuesday: { open: '09:00', close: '19:00', closed: false },
          wednesday: { open: '09:00', close: '19:00', closed: false },
          thursday: { open: '09:00', close: '19:00', closed: false },
          friday: { open: '09:00', close: '19:00', closed: false },
          saturday: { open: '09:00', close: '17:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: true }
        },
        timezone: 'America/New_York',
        currency: 'USD',
        taxRate: 0.08,
        website: 'https://yoursalon.com'
      })
    }

    return NextResponse.json(salonInfo)

  } catch (error: any) {
    console.error('Error fetching salon info:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 