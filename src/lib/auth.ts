// src/lib/auth.ts
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { config } from './config'

// Sign a JWT for payload `{ id, email }`
export function signToken(payload: object) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '2h' })
}

// Verify JWT from request, returns decoded payload or throws
export function verifyToken(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.split(' ')[1]
  if (!token) throw new Error('Missing token')
  return jwt.verify(token, config.jwtSecret)
}

// Verify JWT from token string, returns decoded payload or null
export async function verifyTokenString(token: string) {
  try {
    return jwt.verify(token, config.jwtSecret)
  } catch {
    return null
  }
}
