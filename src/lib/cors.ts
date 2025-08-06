import { NextRequest, NextResponse } from 'next/server'

interface CorsConfig {
  origin: string | string[] | boolean
  methods: string[]
  allowedHeaders: string[]
  credentials: boolean
  maxAge: number
}

const defaultConfig: CorsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
}

export function cors(config: Partial<CorsConfig> = {}) {
  const corsConfig = { ...defaultConfig, ...config }

  return function corsMiddleware(req: NextRequest) {
    const origin = req.headers.get('origin')
    const isAllowedOrigin = corsConfig.origin === true || 
      (Array.isArray(corsConfig.origin) && corsConfig.origin.includes(origin || '')) ||
      corsConfig.origin === origin

    const headers = new Headers()

    // Set CORS headers
    if (isAllowedOrigin) {
      headers.set('Access-Control-Allow-Origin', origin || '*')
    }

    if (corsConfig.credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true')
    }

    headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '))
    headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '))
    headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString())

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers
      })
    }

    return headers
  }
}

export function addCorsHeaders(response: NextResponse, req: NextRequest): NextResponse {
  const corsHeaders = cors()(req)
  
  if (corsHeaders instanceof NextResponse) {
    return corsHeaders
  }

  // Add CORS headers to existing response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

// Pre-configured CORS for different environments
export const productionCors = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
  credentials: true
})

export const developmentCors = cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
})

export const publicCors = cors({
  origin: true,
  credentials: false
}) 