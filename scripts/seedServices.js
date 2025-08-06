// scripts/seedServices.js
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

// 1. Define a Service schema right here
const serviceSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, unique: true },
    description: { type: String, required: true },
    duration:    { type: Number, required: true }, // in minutes
    price:       { type: Number, required: true }, // in dollars
    icon:        { type: String, required: true }, // e.g. 'fas fa-cut'
  },
  { timestamps: true }
);

// 2. Create the model (or reuse an existing compiled one)
const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

// 3. Your seed data
const services = [
  {
    name: 'Haircut & Style',
    description: 'Professional haircut with blow dry and styling to perfection.',
    duration: 60,
    price: 65,
    icon: 'fas fa-cut',
  },
  {
    name: 'Full Color',
    description: 'Complete hair color service with premium products and conditioning.',
    duration: 120,
    price: 120,
    icon: 'fas fa-paint-brush',
  },
  {
    name: 'Hair Treatment',
    description: 'Deep conditioning treatment to restore moisture and shine.',
    duration: 45,
    price: 55,
    icon: 'fas fa-spa',
  },
  {
    name: 'Balayage',
    description: 'Hand-painted highlights for a natural, sun-kissed look.',
    duration: 180,
    price: 200,
    icon: 'fas fa-fire',
  },
  {
    name: 'Kids Cut',
    description: 'Special haircut service for children under 12 years old.',
    duration: 30,
    price: 40,
    icon: 'fas fa-child',
  },
  {
    name: 'Extensions',
    description: 'Premium hair extensions for instant length and volume.',
    duration: 240,
    price: 350,
    icon: 'fas fa-ellipsis-h',
  },
];

async function seed() {
  // Connect
  await mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message)
      console.error('Please make sure MongoDB is running and the connection string is correct')
      process.exit(1)
    })

  // Clear out old docs
  await Service.deleteMany({});
  console.log('🧹 Cleared existing services');

  // Insert seed
  await Service.insertMany(services);
  console.log(`✅ Seeded ${services.length} services!`);

  // Close and exit
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
