import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json(
      { success: false, message: "Identifiant de conversation manquant." },
      { status: 400 }
    );
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        metadata: {
          path: ['event'],
          equals: 'upload',
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Erreur serveur." },
      { status: 500 }
    );
  }
}
