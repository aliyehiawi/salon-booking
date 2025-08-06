import mongoose from 'mongoose'

const salonInfoSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Bliss Hair Studio' },
  description: { type: String, default: 'Professional hair care services in a relaxing atmosphere.' },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'USA' }
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    tiktok: String,
    youtube: String
  },
  businessHours: {
    monday: { open: { type: String, default: '09:00' }, close: { type: String, default: '19:00' }, closed: { type: Boolean, default: false } },
    tuesday: { open: { type: String, default: '09:00' }, close: { type: String, default: '19:00' }, closed: { type: Boolean, default: false } },
    wednesday: { open: { type: String, default: '09:00' }, close: { type: String, default: '19:00' }, closed: { type: Boolean, default: false } },
    thursday: { open: { type: String, default: '09:00' }, close: { type: String, default: '19:00' }, closed: { type: Boolean, default: false } },
    friday: { open: { type: String, default: '09:00' }, close: { type: String, default: '19:00' }, closed: { type: Boolean, default: false } },
    saturday: { open: { type: String, default: '09:00' }, close: { type: String, default: '17:00' }, closed: { type: Boolean, default: false } },
    sunday: { open: { type: String, default: '10:00' }, close: { type: String, default: '16:00' }, closed: { type: Boolean, default: true } }
  },
  timezone: { type: String, default: 'America/New_York' },
  currency: { type: String, default: 'USD' },
  taxRate: { type: Number, default: 0.08, min: 0, max: 1 },
  logo: { type: String, default: null },
  website: { type: String, default: 'https://yoursalon.com' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

salonInfoSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } })

export default mongoose.models.SalonInfo || mongoose.model('SalonInfo', salonInfoSchema) 