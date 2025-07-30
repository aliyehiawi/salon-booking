// src/app/api/auth/unified-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Customer from '@/models/Customer'
import AdminUser from '@/models/AdminUser'
import bcrypt from 'bcrypt'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await dbConnect()
  const { email, password } = await req.json()
  
  try {
    // First try to find a customer
    let customer = await Customer.findOne({ email })
    if (customer) {
      const valid = await bcrypt.compare(password, customer.password)
      if (valid) {
        const token = signToken({ 
          id: customer._id, 
          email: customer.email,
          type: 'customer'
        })
        return NextResponse.json({ 
          token,
          user: {
            id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            type: 'customer'
          }
        })
      }
    }

    // If not a customer, try to find an admin
    let admin = await AdminUser.findOne({ email })
    if (admin) {
      const valid = await bcrypt.compare(password, admin.password)
      if (valid) {
        const token = signToken({ 
          id: admin._id, 
          email: admin.email,
          type: 'admin'
        })
        return NextResponse.json({ 
          token,
          user: {
            id: admin._id,
            email: admin.email,
            type: 'admin'
          }
        })
      }
    }

    // If we get here, either the user doesn't exist or password is wrong
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
} 