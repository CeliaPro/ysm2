import { NextRequest, NextResponse } from "next/server";
import { getPlanningCollection } from "@/lib/astra/planning";
import { withAuthentication } from '@/app/utils/auth.utils';

export const GET = withAuthentication(async (req: NextRequest, user) => {
  try {
    const collection = getPlanningCollection();

    // Show only plans created by the user (uncomment if needed):
    // const latest = await collection.findOne({ createdBy: user.id }, { sort: { "createdAt": -1 } });

    // Show latest plan globally (all users)
    const latest = await collection.findOne({}, { sort: { "createdAt": -1 } });

    if (!latest) {
      return NextResponse.json(
        { success: false, error: "Aucun planning trouvé." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      planningId: latest._id,
      tasks: latest.partialWBS,
      missingFields: latest.missingFields,
    });
  } catch (err) {
    console.error("Erreur dans /api/planning/latest:", err);
    return NextResponse.json(
      { success: false, error: "Échec du chargement de la planification." },
      { status: 500 }
    );
  }
}, "EMPLOYEE");
