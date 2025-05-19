// /app/api/users/request-password-reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/utils/nodemailer' 
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ message: 'If the email exists, a reset link will be sent.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 15); // 15 min

  await prisma.user.update({
    where: { email },
    data: {
      passwordResetToken: resetToken,
      passwordResetTokenExpiry: resetTokenExpiry,
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: email,
    subject: 'Password Reset',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 15 minutes.</p>`,
  });

  return NextResponse.json({ message: 'Reset email sent if account exists.' });
}
