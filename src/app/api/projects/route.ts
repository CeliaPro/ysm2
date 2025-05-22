import { withAuthentication } from '@/app/utils/auth.utils'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const GET = withAuthentication(async (req) => {
  const minimalFetch = req.nextUrl.searchParams.get('minimal') === 'true'
  if (minimalFetch) {
    return prisma.project.findMany({
      select: {
        id: true,
        name: true,
      },
    })
  } else {
    return prisma.project.findMany()
  }
})

export const POST = withAuthentication(async (req) => {
  const { name, description } = await req.json()
  await prisma.project.create({
    data: {
      name,
      description,
    },
  })
  return {
    success: true,
  }
})


//le moi
// PUT /api/projects?id=<id>
// body may include { isArchived: boolean }
export const PUT = withAuthentication(
  async (req) => {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Missing project id' },
        { status: 400 }
      )
    }

    const { isArchived } = await req.json()
    if (typeof isArchived !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Must provide isArchived boolean' },
        { status: 400 }
      )
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { archived: isArchived },   // ← write to the correct field
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
  'MANAGER'    // allow only admin to delete
)
