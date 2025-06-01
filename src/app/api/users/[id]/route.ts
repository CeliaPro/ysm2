import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

// Role mapping function (frontend → Prisma enum)
const mapUserRoleToPrismaRole = (role: string) => {
  if (role === 'admin') return 'ADMIN'
  if (role === 'project_manager') return 'MANAGER'
  if (role === 'employee') return 'EMPLOYEE'
  return 'EMPLOYEE'
}

export const PUT = withAuthentication(
  async (req: NextRequest, user) => {
    if (user.role !== 'ADMIN') {
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

      // Update main user fields (including role mapping)
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: body.fullName,
          role: body.role ? mapUserRoleToPrismaRole(body.role) : undefined,
        },
      })

      // Update project assignments if provided
      if (body.projectAssignments) {
        // Remove all existing
        await prisma.projectMember.deleteMany({ where: { userId } })
        // Add new assignments
        await prisma.projectMember.createMany({
          data: body.projectAssignments.map(a => ({
            userId,
            projectId: a.projectId,
            role: a.role.toUpperCase() as any, // must match enum exactly
          })),
          skipDuplicates: true,
        })
      }

      // Return updated user with project assignments and project info
      const userWithProjects = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          projects: { include: { project: true } }, // correct field!
        },
      })

      // Reformat for frontend
      return NextResponse.json({
        ...userWithProjects,
        projectAssignments: userWithProjects?.projects.map(pm => ({
          projectId: pm.projectId,
          role: pm.role,
          project: pm.project,
        })),
      })
    } catch (err: any) {
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const urlParts = req.nextUrl.pathname.split('/')
    const userId = urlParts[urlParts.length - 1]

    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!existingUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // First, delete all ProjectMember relations for this user
      await prisma.projectMember.deleteMany({
        where: { userId }
      })

      // Now delete the user
      await prisma.user.delete({
        where: { id: userId },
      })

      return NextResponse.json({ success: true })
    } catch (err: any) {
      console.error('User delete error:', err)
      return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
    }
  },
  'ADMIN'
)
