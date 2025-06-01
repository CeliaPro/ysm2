import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthentication } from "@/app/utils/auth.utils";

// Handles: GET /api/projects/[id]/members
export const GET = withAuthentication(async (req) => {
  // Extract projectId from the URL (works for both /api/projects/[id]/members and /api/projects/xxx/members/)
  const urlParts = req.nextUrl.pathname.split("/");
  const membersIndex = urlParts.lastIndexOf("members");
  const projectId = membersIndex > 0 ? urlParts[membersIndex - 1] : undefined;

  if (!projectId || projectId === "projects" || projectId === "api") {
    return NextResponse.json(
      { success: false, message: "Missing or invalid project id" },
      { status: 400 }
    );
  }

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

  return NextResponse.json({ success: true, data: userMembers });
});
