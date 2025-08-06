const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const path = require('path')

// Load environment variables
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env') })
} catch (error) {
  console.log('No .env file found, using default values')
}

// Check for required environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!')
  console.error('Please create a .env file in the root directory with:')
  console.error('MONGODB_URI=mongodb://localhost:27017/salon-booking')
  console.error('JWT_SECRET=your-super-secret-jwt-key')
  console.error('STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key')
  console.error('STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key')
  process.exit(1)
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message)
    console.error('Please make sure MongoDB is running and the connection string is correct')
    process.exit(1)
  })

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