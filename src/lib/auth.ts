// src/lib/auth.ts
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

// Sign a JWT for payload `{ id, email }`
export function signToken(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '2h' })
}

// Verify JWT from request, returns decoded payload or throws
export function verifyToken(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.split(' ')[1]
  if (!token) throw new Error('Missing token')
  return jwt.verify(token, process.env.JWT_SECRET!)
}

// Verify JWT from token string, returns decoded payload or null
export async function verifyTokenString(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    return null
  }
}
