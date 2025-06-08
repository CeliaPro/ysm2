import { NextRequest, NextResponse } from "next/server";
import { withAuthentication } from "@/app/utils/auth.utils";
import { prisma } from "@/lib/prisma";

// Helper to extract projectId from /api/projects/[id]/messages
function getProjectIdFromUrl(req: NextRequest): string | null {
  const match = req.nextUrl.pathname.match(/\/projects\/([^/]+)\/messages/);
  return match ? match[1] : null;
}

// GET: All project messages
export const GET = async (req: NextRequest) => {
  return withAuthentication(async (req, user) => {
    const projectId = getProjectIdFromUrl(req);

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const messages = await prisma.projectMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      messages: messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender: {
          id: msg.user.id,
          name: msg.user.name,
          avatar: null, // If you add avatar in DB, update here
        },
        timestamp: msg.createdAt,
        type: msg.fileUrl
          ? (msg.fileType?.startsWith("image/") ? "image" : "file")
          : "text",
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        fileSize: undefined,
        isOwn: msg.user.id === user.id,
      })),
    });
  })(req);
};

// POST: Create a message
export const POST = async (req: NextRequest) => {
  return withAuthentication(async (req, user) => {
    const projectId = getProjectIdFromUrl(req);

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const { content, fileUrl, fileName, fileType } = await req.json();
    if (!content && !fileUrl) {
      return NextResponse.json({ error: "Message content or file is required" }, { status: 400 });
    }

    const message = await prisma.projectMessage.create({
      data: {
        projectId,
        userId: user.id,
        content: content ?? null,
        fileUrl: fileUrl ?? null,
        fileName: fileName ?? null,
        fileType: fileType ?? null,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        sender: {
          id: message.user.id,
          name: message.user.name,
          avatar: null,
        },
        timestamp: message.createdAt,
        type: message.fileUrl
          ? (message.fileType?.startsWith("image/") ? "image" : "file")
          : "text",
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        isOwn: true,
      },
    });
  })(req);
};
