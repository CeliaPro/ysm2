import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const { email, invitedByAdminId, role } = await req.json();

    if (!email || !invitedByAdminId || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Generate unique invite token
    const token = uuidv4();

    // Set expiration date (e.g., 48 hours)
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // Save invite in DB
    await prisma.invite.create({
      data: {
        email,
        token,
        invitedByAdminId,
        role,
        expiresAt,
        used: false,
      },
    });

    // Send email with Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const inviteUrl = `${BASE_URL}/register?token=${token}`;

    await transporter.sendMail({
      from: `"Admin Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'You are invited to join the platform',
      html: `
        <p>Hello,</p>
        <p>You have been invited to join the platform as a <strong>${role}</strong>.</p>
        <p>Please click the link below to register:</p>
        <p><a href="${inviteUrl}">${inviteUrl}</a></p>
        <p>This invite will expire in 48 hours.</p>
      `,
    });

    return NextResponse.json({ message: 'Invite sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Invite sending failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
