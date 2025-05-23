import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) {
    return new NextResponse("Missing conversationId", { status: 400 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        metadata: {
          equals: {
            event: "upload",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error(err);
    return new NextResponse("Erreur serveur", { status: 500 });
  }
}
