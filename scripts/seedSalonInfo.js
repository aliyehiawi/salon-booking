const mongoose = require('mongoose')
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

// Define SalonInfo schema (simplified for seeding)
const salonInfoSchema = new mongoose.Schema({
  name: String,
  description: String,
  phone: String,
  email: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    tiktok: String,
    youtube: String
  },
  businessHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean }
  },
  timezone: String,
  currency: String,
  taxRate: Number,
  logo: String,
  website: String,
  isActive: Boolean
}, { timestamps: true })

const SalonInfo = mongoose.model('SalonInfo', salonInfoSchema)

// Sample salon data
const salonData = {
  name: 'Bliss Hair Studio',
  description: 'Professional hair care services in a relaxing atmosphere. We specialize in cuts, color, styling, and treatments for all hair types.',
  phone: '(555) 123-4567',
  email: 'hello@blisshairstudio.com',
  address: {
    street: '123 Beauty Street',
    city: 'Salon City',
    state: 'SC',
    zipCode: '12345',
    country: 'USA'
  },
  socialMedia: {
    facebook: 'https://facebook.com/blisshairstudio',
    instagram: 'https://instagram.com/blisshairstudio',
    twitter: 'https://twitter.com/blisshairstudio',
    tiktok: 'https://tiktok.com/@blisshairstudio',
    youtube: 'https://youtube.com/blisshairstudio'
  },
  businessHours: {
    monday: { open: '09:00', close: '19:00', closed: false },
    tuesday: { open: '09:00', close: '19:00', closed: false },
    wednesday: { open: '09:00', close: '19:00', closed: false },
    thursday: { open: '09:00', close: '19:00', closed: false },
    friday: { open: '09:00', close: '19:00', closed: false },
    saturday: { open: '09:00', close: '17:00', closed: false },
    sunday: { open: '10:00', close: '16:00', closed: true }
  },
  timezone: 'America/New_York',
  currency: 'USD',
  taxRate: 0.08,
  logo: null,
  website: 'https://blisshairstudio.com',
  isActive: true
}

async function seedSalonInfo() {
  try {
    // Check if salon info already exists
    const existingSalon = await SalonInfo.findOne({ isActive: true })
    
    if (existingSalon) {
      console.log('Salon info already exists, updating...')
      Object.assign(existingSalon, salonData)
      await existingSalon.save()
      console.log('Salon info updated successfully')
    } else {
      console.log('Creating new salon info...')
      await SalonInfo.create(salonData)
      console.log('Salon info created successfully')
    }
    
    console.log('Salon info seeding completed')
  } catch (error) {
    console.error('Error seeding salon info:', error)
  } finally {
    mongoose.connection.close()
  }
}

seedSalonInfo() 