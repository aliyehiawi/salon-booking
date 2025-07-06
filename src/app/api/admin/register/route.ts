// src/app/api/admin/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import AdminUser from '@/models/AdminUser'
import bcrypt from 'bcrypt'

export async function POST(req: NextRequest) {
  await dbConnect()
  const { email, password } = await req.json()

  const exists = await AdminUser.findOne({ email })
  if (exists) {
    return NextResponse.json({ error: 'Admin already exists' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)
  await AdminUser.create({ email, password: hashed })
  return NextResponse.json({ message: 'Admin created' })
}
