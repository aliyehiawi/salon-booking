// src/app/api/admin/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import AdminUser from '@/models/AdminUser'
import bcrypt from 'bcrypt'
import { verifyTokenString } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await dbConnect()
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { email, password } = await req.json()
    
    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ email })
    if (existingAdmin) {
      return NextResponse.json({ error: 'Admin user already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create admin user
    const adminUser = await AdminUser.create({
      email,
      password: hashedPassword
    })

    return NextResponse.json({ 
      message: 'Admin user created successfully',
      email: adminUser.email 
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
