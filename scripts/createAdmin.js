const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-booking')

// Admin User Schema
const adminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true })

const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema)

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ email: 'admin@salon.com' })
    if (existingAdmin) {
      console.log('Admin user already exists')
      return
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const adminUser = new AdminUser({
      email: 'admin@salon.com',
      password: hashedPassword
    })

    await adminUser.save()
    console.log('Admin user created successfully!')
    console.log('Email: admin@salon.com')
    console.log('Password: admin123')
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    mongoose.connection.close()
  }
}

createAdminUser() 