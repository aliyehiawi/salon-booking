import mongoose from 'mongoose'

const ServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, required: true },  // e.g. "60 min"
    price: { type: String, required: true },     // e.g. "$65"
  },
  { timestamps: true }
)

export default mongoose.models.Service ||
  mongoose.model('Service', ServiceSchema)
