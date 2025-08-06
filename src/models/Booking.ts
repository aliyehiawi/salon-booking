// src/models/Booking.ts
import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    serviceId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName: { type: String, required: true }, 
    date:       { type: String, required: true },
    time:       { type: String, required: true },
    name:       { type: String, required: true },
    email:      { type: String, required: true },
    phone:      { type: String, required: true },
    notes:      { type: String },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }, // Optional customer reference
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'postponed'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
  },
  { timestamps: true }
)

// Prevent model overwrite in dev
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema)
export default Booking
