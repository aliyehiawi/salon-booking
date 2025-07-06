// src/models/AdminUser.ts
import mongoose from 'mongoose'

const adminUserSchema = new mongoose.Schema(
  {
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed
    role:     { type: String, default: 'admin' },
  },
  { timestamps: true }
)

const AdminUser =
  mongoose.models.AdminUser ||
  mongoose.model('AdminUser', adminUserSchema)

export default AdminUser
