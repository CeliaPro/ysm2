// app/api/pdf/upload/route.ts
import { writeFile } from 'fs/promises'
import path from 'path'
import { uploadDocumentFile } from '@/lib/astra/upload'
import { addMessageToConversation } from '@/lib/actions/conversations/conversation'
import { ChatRole } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { withAuthentication } from '@/app/utils/auth.utils' // Adjust if needed

export const config = {
  api: { bodyParser: false },
}

const uploadedFiles: { originalName: string; processingId: string }[] = []

export const POST = withAuthentication(async (req: NextRequest, user) => {
  const form = await req.formData()
  const files = form.getAll('files') as File[]
  const conversationId = form.get('conversationId')?.toString() ?? null

  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  if (!conversationId) {
    return NextResponse.json(
      { error: 'Missing conversationId' },
      { status: 400 }
    )
  }

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const processingId = randomUUID()
    const tempName = `${Date.now()}-${processingId}-${file.name}`
    const tempDir = path.join(process.cwd(), 'lib/temp')
    const tempPath = path.join(tempDir, tempName)

    await writeFile(tempPath, buffer)

    // Upload and embed
    await uploadDocumentFile({
      filePath: tempPath,
      fileName: file.name,
      userId: user.id,
      conversationId,
      metadata: {
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.id,
        conversationId,
        processingId,
      },
    })

    // Log upload as a system message
    await addMessageToConversation({
      conversationId,
      userId: user.id,
      role: ChatRole.SYSTEM,
      content: `[Upload] ${file.name}`,
      metadata: {
        event: 'upload',
        fileSize: file.size,
        fileType: file.type,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.id,
        processingId,
      },
    })

    uploadedFiles.push({
      originalName: file.name,
      processingId,
    })
  }

  return NextResponse.json({
    status: 'success',
    uploadedFiles,
  })
}, 'EMPLOYEE') // Adjust minimum role if needed
