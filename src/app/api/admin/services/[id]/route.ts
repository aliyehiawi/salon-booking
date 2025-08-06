// src/app/api/admin/services/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Service from '@/models/Service'
import { verifyTokenString } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const updates = await req.json()
    
    // Input validation
    if (updates.name && (typeof updates.name !== 'string' || updates.name.trim().length === 0)) {
      return NextResponse.json({ error: 'Service name cannot be empty' }, { status: 400 })
    }

    if (updates.description && (typeof updates.description !== 'string' || updates.description.trim().length === 0)) {
      return NextResponse.json({ error: 'Service description cannot be empty' }, { status: 400 })
    }

    if (updates.duration && (typeof updates.duration !== 'number' || updates.duration <= 0)) {
      return NextResponse.json({ error: 'Duration must be a positive number' }, { status: 400 })
    }

    if (updates.price && (typeof updates.price !== 'string' || updates.price.trim().length === 0)) {
      return NextResponse.json({ error: 'Service price cannot be empty' }, { status: 400 })
    }

    // Check if service exists
    const existingService = await Service.findById(id)
    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Check for name conflicts if name is being updated
    if (updates.name && updates.name.trim() !== existingService.name) {
      const nameConflict = await Service.findOne({ 
        name: updates.name.trim(), 
        _id: { $ne: id } 
      })
      if (nameConflict) {
        return NextResponse.json({ error: 'Service with this name already exists' }, { status: 409 })
      }
    }

    // Clean up the updates object
    const cleanUpdates: any = {}
    if (updates.name) cleanUpdates.name = updates.name.trim()
    if (updates.description) cleanUpdates.description = updates.description.trim()
    if (updates.duration) cleanUpdates.duration = updates.duration
    if (updates.price) cleanUpdates.price = updates.price.trim()

    const updated = await Service.findByIdAndUpdate(id, cleanUpdates, { new: true })
    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('Error updating service:', err)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    
    // Check if service exists
    const existingService = await Service.findById(id)
    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Check if service is being used in any bookings
    const Booking = (await import('@/models/Booking')).default
    const bookingsWithService = await Booking.find({ serviceId: id })
    if (bookingsWithService.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete service that has existing bookings',
        bookingCount: bookingsWithService.length
      }, { status: 409 })
    }

    await Service.findByIdAndDelete(id)
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    console.error('Error deleting service:', err)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
