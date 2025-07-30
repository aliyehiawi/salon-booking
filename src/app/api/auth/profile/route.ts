// src/app/api/auth/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Customer from '@/models/Customer'
import { verifyTokenString } from '@/lib/auth'
import bcrypt from 'bcrypt'

export async function PUT(req: NextRequest) {
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

    const { name, phone, currentPassword, newPassword, preferences } = await req.json()
    
    const customer = await Customer.findById(decoded.id)
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Update basic info
    if (name) customer.name = name
    if (phone) {
      const phoneRegex = /^\+?\d{10,15}$/
      if (!phoneRegex.test(phone)) {
        return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
      }
      customer.phone = phone
    }
    if (preferences) customer.preferences = { ...customer.preferences, ...preferences }

    // Update password if provided
    if (currentPassword && newPassword) {
      const valid = await bcrypt.compare(currentPassword, customer.password)
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
      }
      customer.password = await bcrypt.hash(newPassword, 10)
    }

    await customer.save()

    return NextResponse.json({ 
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        preferences: customer.preferences
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 