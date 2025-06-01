import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET: Fetch single project (by id), all projects (detailed), or all minimal
export const GET = withAuthentication(async (req) => {
  const projectId = req.nextUrl.searchParams.get('id')
  if (projectId) {
    // Single project by ID
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: { documents: true, members: true, tasks: true }
        },
        tasks: true, // <-- get all tasks for Gantt
      },
    })
    if (!project) {
      return NextResponse.json({ success: false, message: 'Projet introuvable' }, { status: 404 })
    }
    const data = {
      ...project,
      documentsCount: project._count.documents,
      membersCount: project._count.members,
      tasksCount: project._count.tasks,
    }
    return NextResponse.json({ success: true, data })
  }

  const minimalFetch = req.nextUrl.searchParams.get('minimal') === 'true'
  if (minimalFetch) {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
      },
    })
    return NextResponse.json(projects)
  } else {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: { documents: true, members: true, tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    const result = projects.map((p) => ({
      ...p,
      documentsCount: p._count.documents,
      membersCount: p._count.members,
      tasksCount: p._count.tasks,
      // Include date fields in all-projects fetch too
      startDate: p.startDate,
      endDate: p.endDate,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
    return NextResponse.json(result)
  }
})

// POST: Create new project (now with optional status and date fields)
export const POST = withAuthentication(async (req) => {
  const { name, description, status, startDate, endDate } = await req.json()
  const created = await prisma.project.create({
    data: {
      name,
      description,
      status: status || 'ACTIF', // Use enum value for prisma
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  })
  return NextResponse.json({ success: true, data: created })
})

// PUT /api/projects?id=<id> - update name, description, archived, status, dates
export const PUT = withAuthentication(
  async (req) => {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Missing project id' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const data: any = {}
    if (typeof body.name === 'string') data.name = body.name
    if (typeof body.description === 'string') data.description = body.description
    if (typeof body.isArchived === 'boolean') data.archived = body.isArchived
    if (typeof body.status === 'string') data.status = body.status // allow updating status
    if (typeof body.startDate === 'string') data.startDate = new Date(body.startDate)
    if (typeof body.endDate === 'string') data.endDate = new Date(body.endDate)

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, data: updated })
  },
  'MANAGER'
)

// DELETE /api/projects?id=<id>
export const DELETE = withAuthentication(
  async (req) => {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Missing project id' },
        { status: 400 }
      )
    }

    await prisma.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  },
  'MANAGER'
)
