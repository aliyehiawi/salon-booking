// scripts/seedServices.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

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
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  });
  console.log('🗄️  Connected to MongoDB');

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
