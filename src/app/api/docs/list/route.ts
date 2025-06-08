// src/app/api/documents/list/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ documents: [] })
  }

  const docs = await prisma.document.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      size: true,
      createdAt: true,
      // add more fields as needed!
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ documents: docs })
}
