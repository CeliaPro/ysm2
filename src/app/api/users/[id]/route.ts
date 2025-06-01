import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'
import { logActivity } from '@/app/utils/logActivity'

const mapUserRoleToPrismaRole = (role: string) => {
  if (role === 'admin') return 'ADMIN'
  if (role === 'project_manager') return 'MANAGER'
  if (role === 'employee') return 'EMPLOYEE'
  return 'EMPLOYEE'
}

export const PUT = withAuthentication(
  async (req: NextRequest, user) => {
    if (user.role !== 'ADMIN') {
      await logActivity({
        userId: user.id,
        action: 'UPDATE_USER',
        status: 'FAILURE',
        description: 'Non-admin attempted to update user',
        req,
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const urlParts = req.nextUrl.pathname.split('/')
    const userId = urlParts[urlParts.length - 1]

    try {
      const body = await req.json() as {
        fullName?: string
        role?: string
        projectAssignments?: { projectId: string, role: string }[]
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          name: body.fullName,
          role: body.role ? mapUserRoleToPrismaRole(body.role) : undefined,
        },
      })

      if (body.projectAssignments) {
        await prisma.projectMember.deleteMany({ where: { userId } })
        await prisma.projectMember.createMany({
          data: body.projectAssignments.map(a => ({
            userId,
            projectId: a.projectId,
            role: a.role.toUpperCase() as any,
          })),
          skipDuplicates: true,
        })
      }

      const userWithProjects = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          projects: { include: { project: true } },
        },
      })

      await logActivity({
        userId: user.id,
        action: 'UPDATE_USER',
        status: 'SUCCESS',
        description: `Updated user ${userId}${body.role ? ' (role: ' + mapUserRoleToPrismaRole(body.role) + ')' : ''}`,
        req,
      })

      return NextResponse.json({
        ...userWithProjects,
        projectAssignments: userWithProjects?.projects.map(pm => ({
          projectId: pm.projectId,
          role: pm.role,
          project: pm.project,
        })),
      })
    } catch (err: any) {
      await logActivity({
        userId: user.id,
        action: 'UPDATE_USER',
        status: 'FAILURE',
        description: `Failed to update user ${userId}: ${err.message}`,
        req,
      })
      console.error('User update error:', err)
      return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
  },
  'ADMIN'
)

// --- DELETE handler (remove user & relations) ---
export const DELETE = withAuthentication(
  async (req, user) => {
    if (user.role !== 'ADMIN') {
      await logActivity({
        userId: user.id,
        action: 'DELETE_USER',
        status: 'FAILURE',
        description: 'Non-admin attempted to delete user',
        req,
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const urlParts = req.nextUrl.pathname.split('/')
    const userId = urlParts[urlParts.length - 1]

    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!existingUser) {
        await logActivity({
          userId: user.id,
          action: 'DELETE_USER',
          status: 'FAILURE',
          description: `Tried to delete non-existent user ${userId}`,
          req,
        })
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      await prisma.projectMember.deleteMany({
        where: { userId }
      })
      await prisma.user.delete({
        where: { id: userId },
      })

      await logActivity({
        userId: user.id,
        action: 'DELETE_USER',
        status: 'SUCCESS',
        description: `Deleted user ${userId}`,
        req,
      })

      return NextResponse.json({ success: true })
    } catch (err: any) {
      await logActivity({
        userId: user.id,
        action: 'DELETE_USER',
        status: 'FAILURE',
        description: `Failed to delete user ${userId}: ${err.message}`,
        req,
      })
      console.error('User delete error:', err)
      return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
  },
  'ADMIN'
)
