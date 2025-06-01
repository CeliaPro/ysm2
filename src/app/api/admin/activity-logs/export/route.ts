import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const logs = await prisma.activityLog.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  })
  // Convert to CSV
  const csvHeaders = [
    'Time',
    'User Name',
    'User Email',
    'User Role',
    'Action',
    'Status',
    'Description',
    'IP Address',
    'Device'
  ]
  const csvRows = logs.map(log => [
    log.createdAt,
    log.user?.name ?? '',
    log.user?.email ?? '',
    log.user?.role ?? '',
    log.action,
    log.status,
    log.description ?? '',
    log.ipAddress ?? '',
    log.device ?? '',
  ].map(String).join(','))
  const csv = [csvHeaders.join(','), ...csvRows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="activity_logs.csv"'
    }
  })
}
