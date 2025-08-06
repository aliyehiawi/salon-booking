// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Customer from '@/models/Customer'
import bcrypt from 'bcrypt'
import { signToken } from '@/lib/auth'
import { authRateLimiter, addRateLimitHeaders, createRateLimitError } from '@/lib/rateLimit'
import { addCorsHeaders } from '@/lib/cors'
import { addApiSecurityHeaders } from '@/lib/security'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimit = await authRateLimiter.check(req)
  if (!rateLimit.allowed) {
    return createRateLimitError(rateLimit.resetTime)
  }

  await dbConnect()
  try {
    const { name, email, phone, password } = await req.json()
    
    // Input sanitization
    const sanitizedName = name?.trim().replace(/[<>]/g, '')
    const sanitizedEmail = email?.trim().toLowerCase()
    const sanitizedPhone = phone?.trim().replace(/[^\d+\-\(\)\s]/g, '')

    // Validation
    if (!sanitizedName || !sanitizedEmail || !sanitizedPhone || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/
    if (!phoneRegex.test(sanitizedPhone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Password validation (minimum 8 characters with complexity)
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json({ 
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
      }, { status: 400 })
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email: sanitizedEmail })
    if (existingCustomer) {
      return NextResponse.json({ error: 'Customer with this email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create customer
    const customer = await Customer.create({
      name: sanitizedName,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      password: hashedPassword
    })

    // Generate JWT token
    const token = signToken({ 
      id: customer._id, 
      email: customer.email,
      type: 'customer'
    })

    const response = NextResponse.json({ 
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    }, { status: 201 })

    const responseWithRateLimit = addRateLimitHeaders(response, rateLimit.remaining, rateLimit.resetTime)
    const responseWithCors = addCorsHeaders(responseWithRateLimit, req)
    return addApiSecurityHeaders(responseWithCors)
  } catch (err: any) {
    logger.error('User registration failed', err, { endpoint: '/api/auth/register' }, req)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
} 