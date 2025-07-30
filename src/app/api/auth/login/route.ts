// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Customer from '@/models/Customer'
import bcrypt from 'bcrypt'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await dbConnect()
  const { email, password } = await req.json()
  try {
    const customer = await Customer.findOne({ email })
    if (!customer) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    const valid = await bcrypt.compare(password, customer.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    const token = signToken({ 
      id: customer._id, 
      email: customer.email,
      type: 'customer'
    })
    return NextResponse.json({ 
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 