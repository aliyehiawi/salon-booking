// src/app/api/admin/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  await dbConnect()
  try {
    const decoded = verifyToken(req) as { email: string }
    return NextResponse.json({ admin: decoded.email })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
