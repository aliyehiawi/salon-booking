// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Customer from '@/models/Customer'
import AdminUser from '@/models/AdminUser'
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
    if (!decoded || !decoded.type) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (decoded.type === 'customer') {
      const customer = await Customer.findById(decoded.id).select('-password')
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }
      return NextResponse.json({ user: customer })
    } else if (decoded.type === 'admin') {
      const admin = await AdminUser.findById(decoded.id).select('-password')
      if (!admin) {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
      }
      return NextResponse.json({ user: admin })
    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 401 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
} 