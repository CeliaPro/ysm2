import { writeFile } from "fs/promises";
import path from "path";
import { uploadPDFFile } from "@/lib/astra/upload";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getUserFromRequest } from "@/lib/getUserFromRequest"; // ✅ your JWT helper

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || !user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.formData();
    const files = data.getAll("files") as File[];
    const conversationId = data.get("conversationId")?.toString();

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const tempFileName = `${Date.now()}-${randomUUID()}-${file.name}`;
      const tempFilePath = path.join(process.cwd(), "lib/temp", tempFileName);

      await writeFile(tempFilePath, buffer);

      await uploadPDFFile({
        filePath: tempFilePath,
        fileName: file.name,
        userId: user.userId,
        conversationId: conversationId || undefined,
      });
    }

    return NextResponse.json({ status: "success" });

  } catch (error) {
    console.error("❌ File upload error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
