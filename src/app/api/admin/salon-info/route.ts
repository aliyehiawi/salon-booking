import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { verifyTokenString } from '@/lib/auth'
import SalonInfo from '@/models/SalonInfo'

export async function GET(req: NextRequest) {
  await dbConnect()
  
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get salon information from salon info collection
    let salonInfo = await SalonInfo.findOne({ isActive: true })
    
    if (!salonInfo) {
      // Create default salon info if none exist
      salonInfo = new SalonInfo({
        name: 'Bliss Hair Studio',
        phone: '+1-555-123-4567',
        email: 'info@blisshairstudio.com',
        address: {
          street: '123 Main Street',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'USA'
        },
        website: 'https://blisshairstudio.com',
        description: 'Professional hair styling and beauty services'
      })
      await salonInfo.save()
    }

    // Return salon info in the format expected by the frontend
    return NextResponse.json({
      _id: salonInfo._id,
      name: salonInfo.name,
      phone: salonInfo.phone,
      email: salonInfo.email,
      address: salonInfo.address,
      website: salonInfo.website,
      description: salonInfo.description
    })

  } catch (error: any) {
    console.error('Error fetching salon info:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await dbConnect()
  
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { name, phone, email, address, website, description } = await req.json()

    // Validate required fields
    if (!name || !phone || !email) {
      return NextResponse.json({ error: 'Name, phone, and email are required' }, { status: 400 })
    }

    // Get or create salon info
    let salonInfo = await SalonInfo.findOne({ isActive: true })
    
    if (!salonInfo) {
      salonInfo = new SalonInfo()
    }

    // Update salon information
    salonInfo.name = name
    salonInfo.phone = phone
    salonInfo.email = email
    salonInfo.address = address || salonInfo.address
    salonInfo.website = website || ''
    salonInfo.description = description || ''

    await salonInfo.save()

    return NextResponse.json({ 
      message: 'Salon information updated successfully',
      salonInfo: {
        _id: salonInfo._id,
        name: salonInfo.name,
        phone: salonInfo.phone,
        email: salonInfo.email,
        address: salonInfo.address,
        website: salonInfo.website,
        description: salonInfo.description
      }
    })

  } catch (error: any) {
    console.error('Error updating salon info:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 