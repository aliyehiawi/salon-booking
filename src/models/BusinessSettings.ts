import mongoose from 'mongoose'

const BusinessSettingsSchema = new mongoose.Schema({
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
  },
  holidays: [String], // e.g. ['2024-05-01', '2024-12-25']
  breakMinutes: { type: Number, default: 15 },
  maxBookingsPerDay: { type: Number, default: 20 },
}, { timestamps: true })

export default mongoose.models.BusinessSettings || mongoose.model('BusinessSettings', BusinessSettingsSchema) 