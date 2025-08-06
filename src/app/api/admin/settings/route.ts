import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import BusinessSettings from '@/models/BusinessSettings';
import { verifyTokenString } from '@/lib/auth';

export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const settings = await BusinessSettings.getSettings();
    return NextResponse.json(settings);
  } catch (err: any) {
    console.error('Error fetching business settings:', err)
    return NextResponse.json({ error: 'Failed to fetch business settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    const decoded = await verifyTokenString(token) as any
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const data = await req.json();
    
    // Validate business name
    if (data.businessName && (typeof data.businessName !== 'string' || data.businessName.trim().length === 0)) {
      return NextResponse.json({ error: 'Business name cannot be empty' }, { status: 400 })
    }

    // Validate business hours
    if (data.businessHours) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      for (const day of days) {
        if (data.businessHours[day]) {
          const hours = data.businessHours[day]
          if (hours.isOpen) {
            if (!hours.open || !hours.close) {
              return NextResponse.json({ error: `Open and close times are required for ${day}` }, { status: 400 })
            }
            // Validate time format (HH:MM)
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
            if (!timeRegex.test(hours.open) || !timeRegex.test(hours.close)) {
              return NextResponse.json({ error: `Invalid time format for ${day}. Use HH:MM format.` }, { status: 400 })
            }
          }
        }
      }
    }

    const settings = await BusinessSettings.updateSettings(data);
    return NextResponse.json(settings);
  } catch (err: any) {
    console.error('Error updating business settings:', err)
    return NextResponse.json({ error: 'Failed to update business settings' }, { status: 500 })
  }
} 