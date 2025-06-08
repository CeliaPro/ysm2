import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuthentication } from '@/app/utils/auth.utils'

export const GET = withAuthentication(async (req, user) => {
  const projects = await prisma.project.findMany({
    where: {
      members: {
        some: {
          userId: user.id
        }
      }
    },
    select: {
      id: true,
      name: true,
      status: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    }
  });
  return NextResponse.json({ projects });
});