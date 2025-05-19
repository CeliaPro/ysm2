// PATCH /api/users/[id]/status to update the status of a user
import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/getUserFromRequest';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { role } = await getUserFromRequest(req);

    if (role !== 'ADMIN') return new NextResponse('Forbidden', { status: 403 });

    const { status } = await req.json();

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch {
    return new NextResponse('Unauthorized', { status: 401 });
  }
}
