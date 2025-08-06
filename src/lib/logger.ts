interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
}

interface LogEntry {
  timestamp: string
  level: string
  message: string
  context?: any
  error?: Error
  requestId?: string
  userId?: string
  ip?: string
  userAgent?: string
  url?: string
  method?: string
}

export class Logger {
  private static instance: Logger
  private isDevelopment: boolean

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error, requestId, userId, ip, userAgent, url, method } = entry
    
    let logString = `[${timestamp}] ${level.toUpperCase()}: ${message}`
    
    if (requestId) logString += ` | RequestID: ${requestId}`
    if (userId) logString += ` | UserID: ${userId}`
    if (ip) logString += ` | IP: ${ip}`
    if (method && url) logString += ` | ${method} ${url}`
    
    if (context && Object.keys(context).length > 0) {
      logString += ` | Context: ${JSON.stringify(context)}`
    }
    
    if (error) {
      logString += ` | Error: ${error.message}`
      if (error.stack) {
        logString += ` | Stack: ${error.stack}`
      }
    }
    
    return logString
  }

  private shouldLog(level: string): boolean {
    const currentLevel = process.env.LOG_LEVEL || 'info'
    const levels = Object.values(LOG_LEVELS)
    const currentIndex = levels.indexOf(currentLevel as any)
    const messageIndex = levels.indexOf(level as any)
    
    return messageIndex <= currentIndex
  }

  private log(level: string, message: string, data?: Partial<LogEntry>): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    }

    const formattedLog = this.formatLog(entry)

    // Console logging
    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error(formattedLog)
        break
      case LOG_LEVELS.WARN:
        console.warn(formattedLog)
        break
      case LOG_LEVELS.INFO:
        console.info(formattedLog)
        break
      case LOG_LEVELS.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedLog)
        }
        break
    }

    // In production, you might want to send logs to a service like CloudWatch, Loggly, etc.
    if (!this.isDevelopment && level === LOG_LEVELS.ERROR) {
      this.sendToExternalService(entry)
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // Implement external logging service integration here
    // Example: AWS CloudWatch, Loggly, Sentry, etc.
    if (process.env.LOG_SERVICE_URL) {
      fetch(process.env.LOG_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOG_SERVICE_TOKEN}`
        },
        body: JSON.stringify(entry)
      }).catch(err => {
        console.error('Failed to send log to external service:', err)
      })
    }
  }

  error(message: string, error?: Error, context?: any, request?: any): void {
    this.log(LOG_LEVELS.ERROR, message, {
      error,
      context,
      requestId: request?.headers?.get('x-request-id'),
      userId: request?.user?.id,
      ip: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
      userAgent: request?.headers?.get('user-agent'),
      url: request?.url,
      method: request?.method
    })
  }

  warn(message: string, context?: any, request?: any): void {
    this.log(LOG_LEVELS.WARN, message, {
      context,
      requestId: request?.headers?.get('x-request-id'),
      userId: request?.user?.id,
      ip: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
      userAgent: request?.headers?.get('user-agent'),
      url: request?.url,
      method: request?.method
    })
  }

  info(message: string, context?: any, request?: any): void {
    this.log(LOG_LEVELS.INFO, message, {
      context,
      requestId: request?.headers?.get('x-request-id'),
      userId: request?.user?.id,
      ip: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
      userAgent: request?.headers?.get('user-agent'),
      url: request?.url,
      method: request?.method
    })
  }

  debug(message: string, context?: any, request?: any): void {
    this.log(LOG_LEVELS.DEBUG, message, {
      context,
      requestId: request?.headers?.get('x-request-id'),
      userId: request?.user?.id,
      ip: request?.headers?.get('x-forwarded-for') || request?.headers?.get('x-real-ip'),
      userAgent: request?.headers?.get('user-agent'),
      url: request?.url,
      method: request?.method
    })
  }

  // Specialized logging methods
  apiError(message: string, error: Error, endpoint: string, request: any): void {
    this.error(`API Error [${endpoint}]: ${message}`, error, { endpoint }, request)
  }

  authError(message: string, request: any): void {
    this.warn(`Authentication Error: ${message}`, { type: 'auth' }, request)
  }

  validationError(message: string, details: any, request: any): void {
    this.warn(`Validation Error: ${message}`, { type: 'validation', details }, request)
  }

  databaseError(message: string, error: Error, operation: string, request?: any): void {
    this.error(`Database Error [${operation}]: ${message}`, error, { operation }, request)
  }

  paymentError(message: string, error: Error, transactionId: string, request?: any): void {
    this.error(`Payment Error [${transactionId}]: ${message}`, error, { transactionId }, request)
  }

  bookingError(message: string, error: Error, bookingId: string, request?: any): void {
    this.error(`Booking Error [${bookingId}]: ${message}`, error, { bookingId }, request)
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Helper function for request logging middleware
export function logRequest(req: any, res: any, next?: any): void {
  const startTime = Date.now()
  
  logger.info(`Request started: ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    userAgent: req.headers?.get('user-agent'),
    ip: req.headers?.get('x-forwarded-for') || req.headers?.get('x-real-ip')
  }, req)

  // If this is a Next.js API route, we can't easily hook into the response
  // In a real Express app, you would use res.on('finish') to log the response
}

// Helper function for error logging
export function logError(error: Error, context?: any, request?: any): void {
  logger.error('Unhandled error occurred', error, context, request)
} 