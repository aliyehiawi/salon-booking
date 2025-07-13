// src/app/api/admin/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import AdminUser from '@/models/AdminUser'
import bcrypt from 'bcrypt'

export async function POST(req: NextRequest) {
  await dbConnect()
  try {
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
