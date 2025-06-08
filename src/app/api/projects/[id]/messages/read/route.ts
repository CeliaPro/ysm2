import { NextRequest, NextResponse } from "next/server";
import { withAuthentication } from "@/app/utils/auth.utils";
import { prisma } from "@/lib/prisma";

// POST: Mark all unread project messages as read for the current user
export async function POST(req: NextRequest) {
  // Extract projectId from URL path
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.findIndex((seg) => seg === "projects") + 1;
  const projectId = segments[idIndex];

  return withAuthentication(async (req, user) => {
    // Find all messages in the project not marked as read by this user
    const unreadMessages = await prisma.projectMessage.findMany({
      where: {
        projectId,
        reads: { none: { userId: user.id } } // <-- use the correct relation name from your Prisma schema!
      },
      select: { id: true }
    });

    // Bulk insert read markers
    if (unreadMessages.length > 0) {
      await prisma.projectMessageRead.createMany({
        data: unreadMessages.map((msg) => ({
          userId: user.id,
          messageId: msg.id,
          readAt: new Date()
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true, markedRead: unreadMessages.length });
  })(req);
}
