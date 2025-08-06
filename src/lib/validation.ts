import { NextRequest, NextResponse } from 'next/server'

// Validation schemas
export interface ValidationSchema {
  [key: string]: {
    required?: boolean
    type?: 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'date' | 'url'
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: any) => boolean | string
    sanitize?: (value: any) => any
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedData: any
}

export class RequestValidator {
  private schema: ValidationSchema

  constructor(schema: ValidationSchema) {
    this.schema = schema
  }

  validate(data: any): ValidationResult {
    const errors: string[] = []
    const sanitizedData: any = {}

    for (const [field, rules] of Object.entries(this.schema)) {
      const value = data[field]

      // Check if required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`)
        continue
      }

      // Skip validation if value is not provided and not required
      if (value === undefined || value === null || value === '') {
        continue
      }

      // Sanitize value
      let sanitizedValue = value
      if (rules.sanitize) {
        sanitizedValue = rules.sanitize(value)
      } else if (typeof value === 'string') {
        sanitizedValue = value.trim()
      }

      // Type validation
      if (rules.type) {
        const typeError = this.validateType(field, sanitizedValue, rules.type)
        if (typeError) {
          errors.push(typeError)
          continue
        }
      }

      // Length validation
      if (typeof sanitizedValue === 'string') {
        if (rules.minLength && sanitizedValue.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters long`)
        }
        if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
          errors.push(`${field} must be no more than ${rules.maxLength} characters long`)
        }
      }

      // Pattern validation
      if (rules.pattern && typeof sanitizedValue === 'string' && !rules.pattern.test(sanitizedValue)) {
        errors.push(`${field} format is invalid`)
      }

      // Custom validation
      if (rules.custom) {
        const customResult = rules.custom(sanitizedValue)
        if (customResult !== true) {
          errors.push(typeof customResult === 'string' ? customResult : `${field} is invalid`)
        }
      }

      sanitizedData[field] = sanitizedValue
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    }
  }

  private validateType(field: string, value: any, type: string): string | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${field} must be a string`
        }
        break
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${field} must be a number`
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${field} must be a boolean`
        }
        break
      case 'email':
        if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return `${field} must be a valid email address`
        }
        break
      case 'phone':
        if (typeof value !== 'string' || !/^\+?[\d\s\-\(\)]{10,15}$/.test(value)) {
          return `${field} must be a valid phone number`
        }
        break
      case 'date':
        if (isNaN(Date.parse(value))) {
          return `${field} must be a valid date`
        }
        break
      case 'url':
        try {
          new URL(value)
        } catch {
          return `${field} must be a valid URL`
        }
        break
    }
    return null
  }
}

// Pre-defined validation schemas
export const userRegistrationSchema: ValidationSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50,
    sanitize: (value: string) => value.trim().replace(/[<>]/g, '')
  },
  email: {
    required: true,
    type: 'email',
    sanitize: (value: string) => value.trim().toLowerCase()
  },
  phone: {
    required: true,
    type: 'phone',
    sanitize: (value: string) => value.trim().replace(/[^\d+\-\(\)\s]/g, '')
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    custom: (value: string) => {
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }
      return true
    }
  }
}

export const serviceSchema: ValidationSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    sanitize: (value: string) => value.trim()
  },
  description: {
    required: true,
    type: 'string',
    minLength: 10,
    maxLength: 500,
    sanitize: (value: string) => value.trim()
  },
  duration: {
    required: true,
    type: 'number',
    custom: (value: number) => value > 0 ? true : 'Duration must be positive'
  },
  price: {
    required: true,
    type: 'string',
    pattern: /^\$?\d+(\.\d{2})?$/,
    sanitize: (value: string) => value.trim()
  }
}

export const bookingSchema: ValidationSchema = {
  serviceId: {
    required: true,
    type: 'string',
    pattern: /^[0-9a-fA-F]{24}$/
  },
  date: {
    required: true,
    type: 'date',
    custom: (value: string) => {
      const date = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date >= today ? true : 'Cannot book for a past date'
    }
  },
  time: {
    required: true,
    type: 'string',
    pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50,
    sanitize: (value: string) => value.trim()
  },
  email: {
    required: true,
    type: 'email',
    sanitize: (value: string) => value.trim().toLowerCase()
  },
  phone: {
    required: true,
    type: 'phone',
    sanitize: (value: string) => value.trim()
  }
}

// Helper function to create validation error response
export function createValidationError(errors: string[]): NextResponse {
  return NextResponse.json({
    error: 'Validation failed',
    details: errors
  }, { status: 400 })
}

// Middleware function for request validation
export function withValidation(schema: ValidationSchema) {
  return function(handler: Function) {
    return async function(req: NextRequest, ...args: any[]) {
      try {
        const data = await req.json()
        const validator = new RequestValidator(schema)
        const result = validator.validate(data)

        if (!result.isValid) {
          return createValidationError(result.errors)
        }

        // Add sanitized data to request
        req.sanitizedData = result.sanitizedData
        
        return handler(req, ...args)
      } catch (error) {
        return NextResponse.json({
          error: 'Invalid request body'
        }, { status: 400 })
      }
    }
  }
} 