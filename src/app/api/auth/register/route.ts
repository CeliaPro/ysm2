import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { storeJwtInCookie } from '@/app/utils/auth.utils'; // 👈 import this

export async function POST(req: NextRequest) {
  try {
    const { password, name, token } = await req.json();

    if (!token || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate the invite token
    const invite = await prisma.invite.findUnique({ where: { token } });

    if (!invite || invite.used || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 });
    }

    const email = invite.email;

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await hash(password, 10);

    // Create the user and mark the invite as used atomically
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'EMPLOYEE',
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      }),
      prisma.invite.update({
        where: { token },
        data: { used: true },
      }),
    ]);

    // 👇 Store JWT in httpOnly cookie and return success response
    return storeJwtInCookie({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
