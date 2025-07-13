import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Service from '@/models/Service'

export async function GET() {
  await dbConnect()
  try {
    const services = await Service.find().sort({ createdAt: 1 })
    return NextResponse.json(services)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
