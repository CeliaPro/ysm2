import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TaskStatus, TaskSeverity } from '@prisma/client'
import { withAuthentication } from '@/app/utils/auth.utils'

// GET: All tasks (optionally by projectId)
export const GET = withAuthentication(async (req) => {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  let tasks
  if (projectId) {
    tasks = await prisma.task.findMany({ where: { projectId } })
  } else {
    tasks = await prisma.task.findMany()
  }

  return NextResponse.json({ success: true, data: tasks })
})

// POST /api/tasks
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Parse date fields (never null, just undefined if not present)
    const startDate = body.startDate ? new Date(body.startDate) : undefined
    const endDate = body.endDate ? new Date(body.endDate) : undefined
    const deadline = body.deadline ? new Date(body.deadline) : undefined

    // For dependencies: array of task IDs
    const dependencies = Array.isArray(body.dependencies) ? body.dependencies : []

    // Build task creation data, only including optional fields if present
    const taskData: any = {
      title: body.title,
      description: body.description ?? '',
      assignee: body.assignee ?? '',
      severity: body.severity ?? 'MOYENNE',
      status: body.status ?? 'A_FAIRE',
      projectId: body.projectId,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(deadline && { deadline }),
      // For dependencies (many-to-many self relation)
      ...(dependencies.length > 0 && {
        dependencies: {
          connect: dependencies.map((id: string) => ({ id })),
        }
      }),
    }

    const newTask = await prisma.task.create({
      data: taskData,
      include: { dependencies: true }, // include dependencies for frontend arrows if needed
    })

    return NextResponse.json({ success: true, data: newTask })
  } catch (err: any) {
    console.error('Task create error:', err)
    return NextResponse.json(
      { success: false, message: err.message || 'Server error' },
      { status: 500 }
    )
  }
}

// PUT: Update task (requires MANAGER)
export const PUT = withAuthentication(async (req, user) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const data = await req.json()
  if (!id) return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 })

  const updated = await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      assignee: data.assignee,
      severity: data.severity as TaskSeverity,
      status: data.status as TaskStatus,
      deadline: new Date(data.deadline),
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined
    }
  })
  return NextResponse.json({ success: true, data: updated })
}, 'MANAGER')

// DELETE: Delete task (requires MANAGER)
export const DELETE = withAuthentication(async (req, user) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 })

  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ success: true })
}, 'MANAGER')
