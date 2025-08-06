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

// Define Discount schema (simplified for seeding)
const discountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  description: String,
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true, min: 0 },
  maxDiscount: Number,
  minimumAmount: { type: Number, default: 0 },
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  applicableServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  customerRestrictions: {
    newCustomersOnly: { type: Boolean, default: false },
    existingCustomersOnly: { type: Boolean, default: false },
    minimumTier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'] },
    specificCustomers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }]
  },
  usageHistory: [{
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    discountAmount: { type: Number, required: true },
    usedAt: { type: Date, default: Date.now }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', required: true }
}, { timestamps: true })

const Discount = mongoose.model('Discount', discountSchema)

// Sample discount data
const discountData = [
  {
    code: 'WELCOME10',
    name: 'Welcome Discount',
    description: '10% off your first visit',
    discountType: 'percentage',
    value: 10,
    maxDiscount: 25,
    minimumAmount: 50,
    usageLimit: 100,
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    customerRestrictions: {
      newCustomersOnly: true
    }
  },
  {
    code: 'LOYAL20',
    name: 'Loyalty Discount',
    description: '20% off for loyal customers',
    discountType: 'percentage',
    value: 20,
    maxDiscount: 50,
    minimumAmount: 100,
    usageLimit: 50,
    validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
    customerRestrictions: {
      existingCustomersOnly: true,
      minimumTier: 'silver'
    }
  },
  {
    code: 'SAVE15',
    name: 'General Savings',
    description: '$15 off any service',
    discountType: 'fixed',
    value: 15,
    minimumAmount: 75,
    usageLimit: 200,
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
    customerRestrictions: {}
  },
  {
    code: 'HALFOFF',
    name: 'Half Price Special',
    description: '50% off selected services',
    discountType: 'percentage',
    value: 50,
    maxDiscount: 100,
    minimumAmount: 30,
    usageLimit: 25,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
    customerRestrictions: {}
  },
  {
    code: 'FREESERVICE',
    name: 'Free Service',
    description: 'Free basic haircut',
    discountType: 'fixed',
    value: 35,
    minimumAmount: 0,
    usageLimit: 10,
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 2 months from now
    customerRestrictions: {
      minimumTier: 'gold'
    }
  }
]

async function seedDiscounts() {
  try {
    // Get the first admin user to use as createdBy
    const AdminUser = mongoose.model('AdminUser', new mongoose.Schema({}))
    const adminUser = await AdminUser.findOne()
    
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.')
      return
    }

    console.log('Seeding discounts...')
    
    for (const discount of discountData) {
      // Check if discount already exists
      const existingDiscount = await Discount.findOne({ code: discount.code })
      
      if (existingDiscount) {
        console.log(`Discount ${discount.code} already exists, skipping...`)
        continue
      }

      // Create new discount
      await Discount.create({
        ...discount,
        createdBy: adminUser._id
      })
      
      console.log(`Created discount: ${discount.code}`)
    }
    
    console.log('Discount seeding completed')
  } catch (error) {
    console.error('Error seeding discounts:', error)
  } finally {
    mongoose.connection.close()
  }
}

seedDiscounts() 