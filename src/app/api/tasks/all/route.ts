import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuthentication } from "@/app/utils/auth.utils";

export const GET = withAuthentication(async () => {
  const tasks = await prisma.task.findMany({
    include: {
      dependencies: { select: { id: true, title: true } },
      // Optionally, also:
      // dependedBy: { select: { id: true, title: true } },
    }
  });
  console.log(JSON.stringify(tasks, null, 2)); // <-- Check the output
  return NextResponse.json({ success: true, data: tasks });
}, "MANAGER");
