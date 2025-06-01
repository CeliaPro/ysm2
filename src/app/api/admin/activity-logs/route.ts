import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Optionally: implement your own admin authentication/authorization check here

export async function GET(req: NextRequest) {
  // Parse query params for filters
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const action = searchParams.get('action')
  const status = searchParams.get('status')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

  // Build filter
  const where: any = {}
  if (userId) where.userId = userId
  if (action) where.action = action
  if (status) where.status = status
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo)
  }

  // Pagination
  const skip = (page - 1) * pageSize
  const take = pageSize

  // Get total count for pagination UI
  const total = await prisma.activityLog.count({ where })

  // Fetch logs with user info (if exists)
  const logs = await prisma.activityLog.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  })

  return NextResponse.json({
    logs,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  })
}
