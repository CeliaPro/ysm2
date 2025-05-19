// GET /api/users   to get all users
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/getUserFromRequest';
import {prisma} from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { id: userId, role } = await getUserFromRequest(req);

    if (role !== 'ADMIN' && role !== 'PROJECT_MANAGER') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(users);
  } catch (error) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
}
