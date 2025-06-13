// app/api/chat/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { withAuthentication } from "@/app/utils/auth.utils";
import { uploadDocumentFile } from "@/lib/astra/upload";
import { addMessageToConversation } from "@/lib/actions/conversations/conversation";
import { ChatRole } from "@prisma/client";
import { logActivity } from "@/app/utils/logActivity";

export const config = {
  api: { bodyParser: false },
};

export const POST = withAuthentication(async (req: NextRequest, user) => {
  // Parse multipart/form-data
  const form = await req.formData();
  const files = form.getAll("files") as File[];
  const conversationId = form.get("conversationId")?.toString() ?? null;

  if (!files.length) {
    await logActivity({
      userId: user.id,
      action: "CHAT_UPLOAD",
      status: "FAILURE",
      description: "Aucun fichier fourni",
      req,
    });
    return NextResponse.json({ success: false, error: "Aucun fichier fourni." }, { status: 400 });
  }
  if (!conversationId) {
    await logActivity({
      userId: user.id,
      action: "CHAT_UPLOAD",
      status: "FAILURE",
      description: "conversationId manquant",
      req,
    });
    return NextResponse.json({ success: false, error: "Identifiant de conversation manquant." }, { status: 400 });
  }

  // Ensure temp dir exists
  const tempDir = path.join(process.cwd(), "lib/temp");
  await mkdir(tempDir, { recursive: true });

  const uploadedFiles: { originalName: string, processingId: string }[] = [];

  for (const file of files) {
    // Write temp file
    const buffer = Buffer.from(await file.arrayBuffer());
    const processingId = randomUUID();
    const tempName = `${Date.now()}-${processingId}-${file.name}`;
    const tempPath = path.join(tempDir, tempName);

    await writeFile(tempPath, buffer);

    // Upload & embed
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
    });

    // Log a system message in the conversation
    await addMessageToConversation({
      conversationId,
      userId: user.id,
      role: ChatRole.SYSTEM,
      content: `[Upload] ${file.name}`,
      metadata: {
        event: "upload",
        fileSize: file.size,
        fileType: file.type,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.id,
        processingId,
      },
    });

    uploadedFiles.push({
      originalName: file.name,
      processingId,
    });

    // Log activity per file
    await logActivity({
      userId: user.id,
      action: "CHAT_UPLOAD",
      status: "SUCCESS",
      description: `Fichier ${file.name} uploadé et indexé dans la conversation ${conversationId}`,
      req,
    });
  }

  return NextResponse.json({
    success: true,
    uploadedFiles,
  });
}, "EMPLOYEE");
