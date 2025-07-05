const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
  service: String,
  date: String,
  time: String,
  name: String,
  email: String,
  phone: String,
  notes: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'postponed'],
    default: 'pending',
  },
}, { timestamps: true })

module.exports = mongoose.model('Booking', bookingSchema)
