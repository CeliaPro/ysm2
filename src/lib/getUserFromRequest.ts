// lib/auth/getUserFromRequest.ts
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface UserFromToken {
  id: string
  email: string
  role: 'ADMIN' | 'PROJECT_MANAGER' | 'EMPLOYEE'
}

export const getUserFromRequest = (req: NextRequest): UserFromToken => {
  const token = req.cookies.get('jwt')?.value

  if (!token) throw new Error('JWT cookie missing')

  const decoded = jwt.verify(token, JWT_SECRET) as UserFromToken
  return decoded
}
