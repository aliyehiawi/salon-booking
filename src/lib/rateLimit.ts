import { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (in production, use Redis or similar)
const store: RateLimitStore = {}

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  private getKey(req: NextRequest): string {
    // Use IP address as key (in production, consider using a more sophisticated method)
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `rate_limit:${ip}`
  }

  private cleanup(): void {
    const now = Date.now()
    Object.keys(store).forEach(key => {
      if (store[key].resetTime <= now) {
        delete store[key]
      }
    })
  }

  async check(req: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    this.cleanup()
    
    const key = this.getKey(req)
    const now = Date.now()
    
    if (!store[key] || store[key].resetTime <= now) {
      // First request or window expired
      store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      }
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: store[key].resetTime
      }
    }
    
    if (store[key].count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: store[key].resetTime
      }
    }
    
    // Increment count
    store[key].count++
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - store[key].count,
      resetTime: store[key].resetTime
    }
  }
}

// Pre-configured rate limiters
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 attempts per 15 minutes
})

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100 // 100 requests per minute
})

export const bookingRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10 // 10 booking attempts per minute
})

// Helper function to add rate limiting headers
export function addRateLimitHeaders(
  response: Response,
  remaining: number,
  resetTime: number
): Response {
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetTime.toString())
  return response
}

// Helper function to create rate limit error response
export function createRateLimitError(resetTime: number): Response {
  const response = new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Reset': resetTime.toString(),
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
      }
    }
  )
  return response
} 