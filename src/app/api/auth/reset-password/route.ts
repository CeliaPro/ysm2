// /app/api/users/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json();

  if (!token || !newPassword) {
    return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetTokenExpiry: {
        gte: new Date(),
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
    },
  });

  return NextResponse.json({ message: 'Password has been reset successfully' });
}
