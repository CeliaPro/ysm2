import { NextRequest, NextResponse } from "next/server";
import { getPlanningCollection } from "@/lib/astra/planning";
import { withAuthentication } from '@/app/utils/auth.utils';

export const GET = withAuthentication(async (req: NextRequest, user) => {
  try {
    const collection = getPlanningCollection();

    // If you want to show only plans created by the user, uncomment and use this query:
    // const latest = await collection.findOne({ createdBy: user.id }, { sort: { "createdAt": -1 } });

    // If you want the latest globally (for all users), keep as is:
    const latest = await collection.findOne({}, { sort: { "createdAt": -1 } });

    return NextResponse.json({
      tasks: latest?.partialWBS || []
    });
  } catch (err) {
    console.error("Error in /api/planning/latest:", err);
    return NextResponse.json({ error: "Échec du chargement de la planification" }, { status: 500 });
  }
}, "EMPLOYEE");
