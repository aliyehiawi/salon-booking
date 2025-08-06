// Simple in-memory cache implementation
// In production, use Redis or similar distributed cache

interface CacheItem {
  value: any
  timestamp: number
  ttl: number
}

class Cache {
  private store: Map<string, CacheItem> = new Map()
  private maxSize: number
  private cleanupInterval: NodeJS.Timeout

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000) // Cleanup every minute
  }

  set(key: string, value: any, ttl: number = 300000): void { // Default 5 minutes
    if (this.store.size >= this.maxSize) {
      this.evictOldest()
    }

    this.store.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const item = this.store.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.store.delete(key)
      return null
    }

    return item.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Date.now()

    for (const [key, item] of this.store.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.store.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Global cache instance
const cache = new Cache()

// Cache keys
export const CACHE_KEYS = {
  SERVICES: 'services',
  SALON_INFO: 'salon_info',
  BUSINESS_SETTINGS: 'business_settings',
  DASHBOARD_STATS: 'dashboard_stats',
  CUSTOMER_LOYALTY: (customerId: string) => `loyalty_${customerId}`,
  BOOKING_HISTORY: (customerId: string) => `bookings_${customerId}`,
  AVAILABLE_SLOTS: (date: string, serviceId: string) => `slots_${date}_${serviceId}`,
  REVIEWS: (serviceId: string) => `reviews_${serviceId}`,
  REPORT_DATA: (type: string, startDate: string, endDate: string) => `report_${type}_${startDate}_${endDate}`
}

// Cache TTLs (in milliseconds)
export const CACHE_TTL = {
  SERVICES: 300000, // 5 minutes
  SALON_INFO: 600000, // 10 minutes
  BUSINESS_SETTINGS: 300000, // 5 minutes
  DASHBOARD_STATS: 300000, // 5 minutes
  CUSTOMER_LOYALTY: 300000, // 5 minutes
  BOOKING_HISTORY: 60000, // 1 minute
  AVAILABLE_SLOTS: 30000, // 30 seconds
  REVIEWS: 300000, // 5 minutes
  REPORT_DATA: 600000 // 10 minutes
}

// Cache wrapper functions
export const cacheService = {
  get: (key: string) => cache.get(key),
  set: (key: string, value: any, ttl?: number) => cache.set(key, value, ttl),
  has: (key: string) => cache.has(key),
  delete: (key: string) => cache.delete(key),
  clear: () => cache.clear(),
  invalidatePattern: (pattern: string) => {
    // Simple pattern invalidation - in production use Redis SCAN
    for (const key of cache['store'].keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  }
}

// Database query optimization helpers
export const queryOptimization = {
  // Add pagination to queries
  paginate: (query: any, page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit
    return query.skip(skip).limit(limit)
  },

  // Add lean() for read-only queries to improve performance
  lean: (query: any) => query.lean(),

  // Select only needed fields
  select: (query: any, fields: string) => query.select(fields),

  // Add indexes hint
  hint: (query: any, index: string) => query.hint(index)
}

// Rate limiting with caching
export const rateLimitCache = {
  attempts: new Map<string, { count: number; resetTime: number }>(),

  check: (key: string, maxAttempts: number, windowMs: number): boolean => {
    const now = Date.now()
    const attempt = rateLimitCache.attempts.get(key)

    if (!attempt || now > attempt.resetTime) {
      rateLimitCache.attempts.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (attempt.count >= maxAttempts) {
      return false
    }

    attempt.count++
    return true
  },

  reset: (key: string) => {
    rateLimitCache.attempts.delete(key)
  }
}

export default cache 