// Configuration management for the salon booking system
interface Config {
  // Database
  mongodbUri: string
  
  // JWT
  jwtSecret: string
  jwtExpiresIn: string
  
  // Application
  nodeEnv: string
  appUrl: string
  appName: string
  
  // Salon Information
  salonName: string
  salonPhone: string
  salonEmail: string
  salonAddress: string
  salonWebsite: string
  
  // Stripe Configuration
  stripeSecretKey: string
  stripePublishableKey: string
  stripeWebhookSecret: string
  
  // Points System
  pointsPerDollar: number
  pointsToDiscountRate: number
  pointsNeededForDiscount: number
  discountPercentagePer100Points: number
  maxPointsRedemptionPercentage: number
  
  // Feature Flags
  enableSmsNotifications: boolean
  enableEmailNotifications: boolean
  enableFileUploads: boolean
  enableAnalytics: boolean
  
  // Security
  bcryptRounds: number
  rateLimitWindow: string
  rateLimitMaxRequests: number
}

// Validate required environment variables
function validateConfig(): void {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Get configuration with defaults
export function getConfig(): Config {
  validateConfig()
  
  return {
    // Database
    mongodbUri: process.env.MONGODB_URI!,
    
    // JWT
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
    
    // Application
    nodeEnv: process.env.NODE_ENV || 'development',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'Salon Booking',
    
    // Salon Information
    salonName: process.env.NEXT_PUBLIC_SALON_NAME || 'Your Salon Name',
    salonPhone: process.env.NEXT_PUBLIC_SALON_PHONE || '+1-555-123-4567',
    salonEmail: process.env.NEXT_PUBLIC_SALON_EMAIL || 'info@yoursalon.com',
    salonAddress: process.env.NEXT_PUBLIC_SALON_ADDRESS || '123 Main St, City, State 12345',
    salonWebsite: process.env.NEXT_PUBLIC_SALON_WEBSITE || 'https://yoursalon.com',
    
    // Stripe Configuration
    stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    
    // Points System
    pointsPerDollar: parseFloat(process.env.POINTS_PER_DOLLAR || '1'),
    pointsToDiscountRate: parseFloat(process.env.POINTS_TO_DISCOUNT_RATE || '0.01'),
    pointsNeededForDiscount: parseInt(process.env.POINTS_NEEDED_FOR_DISCOUNT || '100'),
    discountPercentagePer100Points: parseFloat(process.env.DISCOUNT_PERCENTAGE_PER_100_POINTS || '5'),
    maxPointsRedemptionPercentage: parseFloat(process.env.MAX_POINTS_REDEMPTION_PERCENTAGE || '20'),
    
    // Feature Flags
    enableSmsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    enableFileUploads: process.env.ENABLE_FILE_UPLOADS === 'true',
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    
    // Security
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
    rateLimitWindow: process.env.RATE_LIMIT_WINDOW || '15m',
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  }
}

// Export singleton config instance
export const config = getConfig()

// Helper functions
export function isDevelopment(): boolean {
  return config.nodeEnv === 'development'
}

export function isProduction(): boolean {
  return config.nodeEnv === 'production'
}

export function isTest(): boolean {
  return config.nodeEnv === 'test'
} 