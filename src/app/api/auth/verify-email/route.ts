// GET /api/auth/verify-email?token=xyz
import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return new NextResponse('Missing token', { status: 400 });

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || new Date(record.expiresAt) < new Date()) {
    return new NextResponse('Invalid or expired token', { status: 400 });
  }

  await prisma.user.update({
    where: { email: record.email },
    data: { isVerified: true }, // Make sure `isVerified` exists in your `User` model
  });

  await prisma.verificationToken.delete({ where: { token } });

  return new NextResponse('Email verified successfully', { status: 200 });
}
