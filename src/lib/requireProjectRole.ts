import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from './getUserFromRequest'; // adjust the path as needed
import { prisma } from '@/lib/prisma';
import { ProjectRole } from '@prisma/client'; // from your enum

export async function requireProjectRole(
  req: NextRequest,
  projectId: string,
  allowedRoles: ProjectRole[]
): Promise<{ authorized: boolean; response?: NextResponse }> {
  const user = await getUserFromRequest(req);

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: user.userId,
        projectId,
      },
    },
  });

  if (!membership || !allowedRoles.includes(membership.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  return { authorized: true };
}
