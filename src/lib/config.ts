// Configuration management for the salon booking system
interface Config {
  // Database
  database: {
    uri: string
    name: string
  }
  
  // JWT
  jwt: {
    secret: string
    expiresIn: string
  }
  
  // Stripe
  stripe: {
    secretKey: string
    publishableKey: string
    webhookSecret: string
  }
  
  // Email
  email: {
    host: string
    port: number
    user: string
    pass: string
    from: string
  }
  
  // SMS (Twilio)
  sms: {
    accountSid: string
    authToken: string
    phoneNumber: string
  }
  
  // App
  app: {
    name: string
    url: string
    environment: string
    port: number
  }
  
  // Security
  security: {
    bcryptRounds: number
    sessionSecret: string
    allowedOrigins: string[]
  }
  
  // Logging
  logging: {
    level: string
    serviceUrl?: string
    serviceToken?: string
  }
}

function validateConfig(): Config {
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`)
  }

  return {
    database: {
      uri: process.env.MONGODB_URI!,
      name: process.env.MONGODB_NAME || 'salon-booking'
    },
    
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY!,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!
    },
    
    email: {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
      from: process.env.SMTP_FROM || 'noreply@salon.com'
    },
    
    sms: {
      accountSid: process.env.TWILIO_ACCOUNT_SID!,
      authToken: process.env.TWILIO_AUTH_TOKEN!,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER!
    },
    
    app: {
      name: process.env.APP_NAME || 'Salon Booking System',
      url: process.env.APP_URL || 'http://localhost:3000',
      environment: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000')
    },
    
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      sessionSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET!,
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    },
    
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      serviceUrl: process.env.LOG_SERVICE_URL,
      serviceToken: process.env.LOG_SERVICE_TOKEN
    }
  }
}

// Export validated config
export const config = validateConfig()

// Environment-specific helpers
export const isDevelopment = config.app.environment === 'development'
export const isProduction = config.app.environment === 'production'
export const isTest = config.app.environment === 'test'

// Feature flags
export const features = {
  emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
  smsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS !== 'false',
  stripePayments: process.env.ENABLE_STRIPE_PAYMENTS !== 'false',
  rateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  logging: process.env.ENABLE_LOGGING !== 'false'
}

// Database connection string with options
export const getDatabaseUri = (): string => {
  const uri = config.database.uri
  const options = {
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0
  }
  
  const queryString = new URLSearchParams(options as any).toString()
  return queryString ? `${uri}?${queryString}` : uri
}

// Stripe configuration
export const getStripeConfig = () => ({
  apiVersion: '2023-10-16' as const,
  typescript: true
})

// Email configuration
export const getEmailConfig = () => ({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass
  },
  tls: {
    rejectUnauthorized: false
  }
})

// CORS configuration
export const getCorsConfig = () => ({
  origin: isProduction ? config.security.allowedOrigins : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ]
})

// Rate limiting configuration
export const getRateLimitConfig = () => ({
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  },
  booking: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10
  }
})

// Validation schemas
export const validationSchemas = {
  userRegistration: {
    name: { minLength: 2, maxLength: 50 },
    email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone: { pattern: /^\+?[\d\s\-\(\)]{10,15}$/ },
    password: { minLength: 8, requireComplexity: true }
  },
  service: {
    name: { minLength: 2, maxLength: 100 },
    description: { minLength: 10, maxLength: 500 },
    duration: { min: 1, max: 480 }, // 1 minute to 8 hours
    price: { pattern: /^\$?\d+(\.\d{2})?$/ }
  },
  booking: {
    date: { futureOnly: true },
    time: { pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ }
  }
}

// Export default config for backward compatibility
export default config 