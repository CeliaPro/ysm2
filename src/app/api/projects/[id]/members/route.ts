import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthentication } from "@/app/utils/auth.utils";
import { logActivity } from "@/app/utils/logActivity";

// Handles: GET /api/projects/[id]/members
export const GET = withAuthentication(async (req, user) => {
  // Optionally grab sessionId from cookie
  const sessionId = req.cookies?.get?.('sessionId')?.value;

  // Extract projectId from the URL
  const urlParts = req.nextUrl.pathname.split("/");
  const membersIndex = urlParts.lastIndexOf("members");
  const projectId = membersIndex > 0 ? urlParts[membersIndex - 1] : undefined;

  if (!projectId || projectId === "projects" || projectId === "api") {
    // Log failure: missing/invalid projectId
    await logActivity({
      userId: user.id,
      action: "LIST_PROJECT_MEMBERS",
      status: "FAILURE",
      description: "Missing or invalid project id while listing project members",
      req,
      sessionId,
    });
    return NextResponse.json(
      { success: false, message: "Missing or invalid project id" },
      { status: 400 }
    );
  }

  try {
    // Fetch project members with their user details
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Extract the user objects (filter out nulls if any)
    const userMembers = members
      .map(m => m.user)
      .filter((user): user is { id: string; name: string | null; email: string } => !!user);

    // Log success
    await logActivity({
      userId: user.id,
      action: "LIST_PROJECT_MEMBERS",
      status: "SUCCESS",
      description: `Listed members for project ${projectId}`,
      req,
      sessionId,
    });

    return NextResponse.json({ success: true, data: userMembers });
  } catch (error: any) {
    // Log failure
    await logActivity({
      userId: user.id,
      action: "LIST_PROJECT_MEMBERS",
      status: "FAILURE",
      description: `Error listing project members for project ${projectId}: ${error.message}`,
      req,
      sessionId,
    });
    return NextResponse.json(
      { success: false, message: "Failed to fetch project members", error: error.message },
      { status: 500 }
    );
  }
});
