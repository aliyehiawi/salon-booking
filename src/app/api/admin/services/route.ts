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
    const decoded = await verifyTokenString(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const services = await Service.find().sort({ createdAt: 1 })
    return NextResponse.json(services)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
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
    const decoded = await verifyTokenString(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { name, description, duration, price } = await req.json()

    const svc = await Service.create({
      name,
      description,
      duration,
      price
    })

    return NextResponse.json(svc, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
