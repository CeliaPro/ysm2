// app/api/tasks/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TaskStatus, TaskSeverity } from '@prisma/client'
import { withAuthentication } from '@/app/utils/auth.utils'
import { logActivity } from '@/app/utils/logActivity'

// GET: All tasks (optionally by projectId)
export const GET = withAuthentication(async (req, user) => {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  try {
    const tasks = await prisma.task.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        dependencies: { select: { id: true, title: true } },
      }
    })

    // Optional: log read access (can be removed if logs are too noisy)
    await logActivity({
      userId: user.id,
      action: 'LIST_TASKS',
      status: 'SUCCESS',
      description: projectId
        ? `Fetched tasks for project ${projectId}`
        : 'Fetched all tasks',
      req,
    })

    return NextResponse.json({ success: true, data: tasks })
  } catch (err: any) {
    await logActivity({
      userId: user.id,
      action: 'LIST_TASKS',
      status: 'FAILURE',
      description: `Failed to fetch tasks: ${err.message}`,
      req,
    })
    return NextResponse.json(
      { success: false, message: err.message || 'Server error' },
      { status: 500 }
    )
  }
})

// POST: Create a task (with dependencies)
export const POST = withAuthentication(async (req, user) => {
  try {
    const body = await req.json()

    // Parse dates
    const startDate = body.startDate ? new Date(body.startDate) : undefined
    const endDate = body.endDate ? new Date(body.endDate) : undefined
    const deadline = body.deadline ? new Date(body.deadline) : undefined

    // Array of task IDs this task depends on
    const dependencies = Array.isArray(body.dependencies) ? body.dependencies : []

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
      ...(dependencies.length > 0 && {
        dependencies: {
          connect: dependencies.map((id: string) => ({ id })),
        }
      }),
    }

    const newTask = await prisma.task.create({
      data: taskData,
      include: {
        dependencies: { select: { id: true, title: true } },
      },
    })

    // Log success
    await logActivity({
      userId: user.id,
      action: 'CREATE_TASK',
      status: 'SUCCESS',
      description: `Created task "${body.title}" in project ${body.projectId}`,
      req,
    })

    return NextResponse.json({ success: true, data: newTask })
  } catch (err: any) {
    await logActivity({
      userId: user.id,
      action: 'CREATE_TASK',
      status: 'FAILURE',
      description: `Failed to create task: ${err.message}`,
      req,
    })
    return NextResponse.json(
      { success: false, message: err.message || 'Server error' },
      { status: 500 }
    )
  }
})

// PUT: Update task (requires MANAGER)
export const PUT = withAuthentication(async (req, user) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const data = await req.json()
  if (!id) {
    await logActivity({
      userId: user.id,
      action: 'UPDATE_TASK',
      status: 'FAILURE',
      description: 'Missing task id for update',
      req,
    })
    return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 })
  }

  try {
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
      },
      include: {
        dependencies: { select: { id: true, title: true } },
      }
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE_TASK',
      status: 'SUCCESS',
      description: `Updated task "${data.title}" with id ${id}`,
      req,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    await logActivity({
      userId: user.id,
      action: 'UPDATE_TASK',
      status: 'FAILURE',
      description: `Failed to update task with id ${id}: ${err.message}`,
      req,
    })
    return NextResponse.json(
      { success: false, message: err.message || 'Server error' },
      { status: 500 }
    )
  }
}, 'MANAGER')

// DELETE: Delete task (requires MANAGER)
export const DELETE = withAuthentication(async (req, user) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    await logActivity({
      userId: user.id,
      action: 'DELETE_TASK',
      status: 'FAILURE',
      description: 'Missing task id for deletion',
      req,
    })
    return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 })
  }

  try {
    await prisma.task.delete({ where: { id } })
    await logActivity({
      userId: user.id,
      action: 'DELETE_TASK',
      status: 'SUCCESS',
      description: `Deleted task with id ${id}`,
      req,
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    await logActivity({
      userId: user.id,
      action: 'DELETE_TASK',
      status: 'FAILURE',
      description: `Failed to delete task with id ${id}: ${err.message}`,
      req,
    })
    return NextResponse.json(
      { success: false, message: err.message || 'Server error' },
      { status: 500 }
    )
  }
}, 'MANAGER')
