// src/models/Customer.ts
import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true }, // hashed
    googleId: { type: String, unique: true, sparse: true }, // for Google OAuth
    avatar: { type: String }, // profile picture URL
    preferences: {
      notifications: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    stripeCustomerId: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
)

// Prevent model overwrite in dev
const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema)
export default Customer 