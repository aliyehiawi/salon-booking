import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BusinessSettings from '@/models/BusinessSettings';

export async function GET() {
  await dbConnect();
  const settings = await BusinessSettings.findOne();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const data = await req.json();
  const settings = await BusinessSettings.findOneAndUpdate({}, data, { upsert: true, new: true });
  return NextResponse.json(settings);
} 