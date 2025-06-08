// /app/api/uploads/project-message/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuthentication } from "@/app/utils/auth.utils";
import { generatePresignedUrl } from "@/app/utils/s3.utils";
import { v4 as uuidv4 } from "uuid";

// POST: Returns a presigned URL for client to upload file to S3
export const POST = withAuthentication(async (
  req: NextRequest,
  user: any
) => {
  const { fileName, fileType, projectId } = await req.json();

  if (!fileName || !fileType || !projectId) {
    return NextResponse.json(
      { error: "fileName, fileType, and projectId are required" },
      { status: 400 }
    );
  }

  // Generate a unique S3 key
  const fileKey = `project-messages/${projectId}/${uuidv4()}-${fileName}`;

  // Generate presigned upload URL
  const uploadUrl = await generatePresignedUrl(fileKey, fileType);

  return NextResponse.json({
    uploadUrl,
    fileKey,
    fileName,
    fileType,
    fileUrl: `https://ysm-ensam.s3.amazonaws.com/${fileKey}`,
  });
});
