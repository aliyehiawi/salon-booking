import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Service from '@/models/Service'
import { cacheService, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'

export async function GET(req: NextRequest) {
  await dbConnect()
  
  try {
    // Check cache first
    const cacheKey = CACHE_KEYS.SERVICES
    const cachedServices = cacheService.get(cacheKey)
    
    if (cachedServices) {
      return NextResponse.json(cachedServices)
    }

    // Fetch from database
    const services = await Service.find({ isActive: true })
      .select('name description duration price category')
      .sort({ name: 1 })
      .lean()

    // Cache the result
    cacheService.set(cacheKey, services, CACHE_TTL.SERVICES)

    return NextResponse.json(services)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await dbConnect()
  
  try {
    const { name, description, duration, price, category } = await req.json()
    
    // Validation
    if (!name || !description || !duration || !price) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (price <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
    }

    const service = new Service({
      name: name.trim(),
      description: description.trim(),
      duration,
      price: `$${parseFloat(price).toFixed(2)}`,
      category: category || 'General'
    })

    await service.save()

    // Invalidate services cache
    cacheService.delete(CACHE_KEYS.SERVICES)

    return NextResponse.json(service, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
