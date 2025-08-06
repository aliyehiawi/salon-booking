const fs = require('fs')
const path = require('path')

const envTemplate = `# Database Configuration
MONGODB_URI=mongodb://localhost:27017/salon-booking

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=2h

# Stripe Configuration (replace with your actual Stripe keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Points System Configuration
POINTS_PER_DOLLAR=1
POINTS_NEEDED_FOR_DISCOUNT=100
DISCOUNT_PERCENTAGE_PER_100_POINTS=5
MAX_POINTS_REDEMPTION_PERCENTAGE=20

# Salon Default Configuration
DEFAULT_SALON_NAME=Bliss Hair Studio
DEFAULT_SALON_PHONE=(555) 123-4567
DEFAULT_SALON_EMAIL=hello@blisshairstudio.com
DEFAULT_SALON_ADDRESS=123 Beauty Street, Salon City, SC 12345
DEFAULT_SALON_WEBSITE=https://blisshairstudio.com
DEFAULT_TIMEZONE=America/New_York
DEFAULT_CURRENCY=USD
DEFAULT_TAX_RATE=0.08

# Feature Flags
ENABLE_GOOGLE_LOGIN=false
ENABLE_SMS_NOTIFICATIONS=false
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_LOYALTY_SYSTEM=true
ENABLE_PAYMENT_SYSTEM=true

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-key-change-this-in-production
`

function setupEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists!')
    console.log('If you want to overwrite it, delete the existing .env file first.')
    return
  }
  
  try {
    fs.writeFileSync(envPath, envTemplate)
    console.log('✅ .env file created successfully!')
    console.log('📝 Please update the following variables with your actual values:')
    console.log('   - MONGODB_URI (if using a different database)')
    console.log('   - JWT_SECRET (generate a secure random string)')
    console.log('   - STRIPE_SECRET_KEY (from your Stripe dashboard)')
    console.log('   - STRIPE_PUBLISHABLE_KEY (from your Stripe dashboard)')
    console.log('   - STRIPE_WEBHOOK_SECRET (from your Stripe dashboard)')
    console.log('')
    console.log('🔗 Get your Stripe keys from: https://dashboard.stripe.com/apikeys')
    console.log('🔗 Generate a secure JWT secret: https://generate-secret.vercel.app/32')
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message)
  }
}

setupEnv() 