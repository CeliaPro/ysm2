import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthentication } from "@/app/utils/auth.utils";
import { logActivity } from "@/app/utils/logActivity";

export const GET = withAuthentication(async (req, user) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        dependencies: { select: { id: true, title: true } },
      }
    });

    // Optional: Log that tasks were accessed (for auditing who accessed what)
    await logActivity({
      userId: user.id,
      action: 'LIST_TASKS',
      status: 'SUCCESS',
      description: 'Fetched all tasks',
      req,
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (err: any) {
    await logActivity({
      userId: user.id,
      action: 'LIST_TASKS',
      status: 'FAILURE',
      description: `Failed to fetch tasks: ${err.message}`,
      req,
    });

    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}, "MANAGER");
