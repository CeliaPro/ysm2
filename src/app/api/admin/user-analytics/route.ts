import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  // Get all users and aggregate their activity logs
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLogin: true,
      activityLogs: {
        select: {
          action: true,
          status: true,
          createdAt: true,
          device: true,
        }
      },
      documents: true,
    }
  })

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)

  // Map user analytics
  const analytics = users.map(user => {
    const todayLogs = user.activityLogs.filter(
      log => new Date(log.createdAt) >= today
    ).length
    const weekLogs = user.activityLogs.filter(
      log => new Date(log.createdAt) >= weekAgo
    ).length
    const uploadsToday = user.activityLogs.filter(
      log => log.action === 'UPLOAD' && new Date(log.createdAt) >= today
    ).length
    const downloadsToday = user.activityLogs.filter(
      log => log.action === 'DOWNLOAD' && new Date(log.createdAt) >= today
    ).length
    const documentsAccessed = user.documents.length
    const lastActiveDevice = user.activityLogs.length > 0
      ? user.activityLogs[user.activityLogs.length - 1].device
      : undefined
    // Optional: Risk scoring (just a demo)
    const failedLogins = user.activityLogs.filter(
      log => log.action === 'FAILED_LOGIN'
    ).length
    let riskScore: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
    if (failedLogins > 10) riskScore = 'HIGH'
    else if (failedLogins > 3) riskScore = 'MEDIUM'

    return {
      id: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
      },
      todayLogs,
      weekLogs,
      documentsAccessed,
      uploadsToday,
      downloadsToday,
      lastActiveDevice,
      riskScore,
    }
  })

  return NextResponse.json({ users: analytics })
}
