// src/app/api/admin/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
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

    return NextResponse.json({ admin: decoded.email })
  } catch (err: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
