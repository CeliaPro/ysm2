import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;

// Password hashing and verification
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// JWT token generation with payload (userId + role)
export function generateToken(payload: object): string {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// Extract userId and role from the JWT token
export function getUserIdFromRequest(req: NextRequest): { id: string, role: string } {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) throw new Error('Unauthorized');
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string, role: string };
  return { id: decoded.id, role: decoded.role };
}
