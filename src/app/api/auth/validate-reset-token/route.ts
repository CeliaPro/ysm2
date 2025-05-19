// app/api/invite/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const invite = await prisma.invite.findUnique({ where: { token } });

    if (!invite) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    if (invite.used) {
      return NextResponse.json({ error: 'This invite has already been used.' }, { status: 400 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite has expired.' }, { status: 400 });
    }

    // Only return safe public invite details
    return NextResponse.json({
      email: invite.email,
      invitedByAdminId: invite.invitedByAdminId,
      expiresAt: invite.expiresAt,
    });
  } catch (error: any) {
    console.error('Invite validation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
