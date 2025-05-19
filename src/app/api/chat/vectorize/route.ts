import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { uploadPDFFile } from "@/lib/astra/upload";
import { randomUUID } from "crypto";
import { getUserFromRequest } from "@/lib/getUserFromRequest"; // Using your auth helper for user extraction

export const config = {
  api: { bodyParser: false }
};

export async function POST(req: NextRequest) {
  const tempDir = path.join(process.cwd(), "lib/temp");

  try {
    // Extract user info and ensure valid authorization
    const user = await getUserFromRequest(req);
    if (!user || !user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process the form data
    const form = await req.formData();
    const file = form.get("file");
    const conversationId = form.get("conversationId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({
        success: false,
        error: "No valid file provided"
      }, { status: 400 });
    }

    // Create metadata for the uploaded file
    const metadata = {
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user.userId,
      conversationId: conversationId?.toString() ?? null,
      processingId: randomUUID()
    };

    // Ensure the temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    // Generate a unique temporary filename
    const tempFileName = `${Date.now()}-${metadata.processingId}-${file.name}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Write the file to the temp directory
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempFilePath, buffer);

    // Upload and process the file
    try {
      await uploadPDFFile({
        filePath: tempFilePath,
        fileName: file.name,
        userId: user.userId,
        conversationId: conversationId?.toString(),
        metadata // Send metadata with the upload
      });

      // Return success response with metadata
      return NextResponse.json({
        success: true,
        metadata
      });
    } catch (error) {
      console.error("File upload failed:", error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "File upload failed"
      }, { status: 500 });
    } finally {
      // Cleanup temp file regardless of success/failure
      try {
        await fs.unlink(tempFilePath);
      } catch (deleteError) {
        console.error("Failed to delete temp file:", deleteError);
      }
    }

  } catch (err) {
    console.error("Vectorization error:", err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Internal Error"
    }, { status: 500 });
  }
}
