// /api/users/[id] to get, update, delete a user by id
import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/getUserFromRequest';
import bcrypt from 'bcrypt';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: userId, role } = await getUserFromRequest(req);

    if (parseInt(params.id, 10) !== Number(userId) && role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) return new NextResponse('User not found', { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: userId, role } = await getUserFromRequest(req);

    if (parseInt(params.id) !== Number(userId) && role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const data = await req.json();
    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { role } = await getUserFromRequest(req);

    if (role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    await prisma.user.delete({ where: { id: params.id } });
    return new NextResponse('User deleted');
  } catch {
    return new NextResponse('Unauthorized', { status: 401 });
  }
}
export async function POST(req: NextRequest) {
    try {
      const { role } = await getUserFromRequest(req);
  
      if (role !== 'ADMIN') {
        return new NextResponse('Forbidden', { status: 403 });
      }
  
      const { name, email, password, userRole } = await req.json();
  
      if (!name || !email || !password || !userRole) {
        return new NextResponse('Missing required fields', { status: 400 });
      }
  
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return new NextResponse('Email already in use', { status: 409 });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: userRole, // 'admin' | 'project_manager' | 'employee'
        },
      });
  
      // Optionally trigger email verification here
  
      return NextResponse.json(
        { id: newUser.id, email: newUser.email },
        { status: 201 }
      );
    } catch (error) {
      return new NextResponse('Server Error', { status: 500 });
    }
  }
