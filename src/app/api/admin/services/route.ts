// src/app/api/admin/services/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
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

    const services = await Service.find().sort({ createdAt: 1 })
    return NextResponse.json(services)
  } catch (err: any) {
    console.error('Error fetching services:', err)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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

    const { name, description, duration, price } = await req.json()

    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Service name is required' }, { status: 400 })
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ error: 'Service description is required' }, { status: 400 })
    }

    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json({ error: 'Valid duration is required' }, { status: 400 })
    }

    if (!price || typeof price !== 'string' || price.trim().length === 0) {
      return NextResponse.json({ error: 'Service price is required' }, { status: 400 })
    }

    // Check if service with same name already exists
    const existingService = await Service.findOne({ name: name.trim() })
    if (existingService) {
      return NextResponse.json({ error: 'Service with this name already exists' }, { status: 409 })
    }

    const svc = await Service.create({
      name: name.trim(),
      description: description.trim(),
      duration,
      price: price.trim()
    })

    return NextResponse.json(svc, { status: 201 })
  } catch (err: any) {
    console.error('Error creating service:', err)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
