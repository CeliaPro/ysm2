import { withAuthentication } from "@/app/utils/auth.utils";
import { generatePresignedUrl } from "@/app/utils/s3.utils";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { logActivity } from '@/app/utils/logActivity';

export const POST = withAuthentication(async (req, user) => {
  try {
    const { contentType } = await req.json();
    if (!contentType) {
      // Log failure
      await logActivity({
        userId: user.id,
        action: 'REQUEST_PRESIGNED_URL',
        status: 'FAILURE',
        description: 'Missing contentType for presigned URL',
        req,
      });
      return NextResponse.json({
        success: false,
        message: "Missing contentType",
      }, { status: 400 });
    }

    const keyZehwani = randomUUID();
    const presignedUrl = await generatePresignedUrl('docs/' + keyZehwani, contentType);

    // Log success
    await logActivity({
      userId: user.id,
      action: 'REQUEST_PRESIGNED_URL',
      status: 'SUCCESS',
      description: `Generated presigned upload URL for key ${keyZehwani}`,
      req,
    });

    return NextResponse.json({
      success: true,
      key: keyZehwani,
      message: "File presigned url generated successfully",
      presignedUrl,
    });
  } catch (error: any) {
    // Log server error
    await logActivity({
      userId: user.id,
      action: 'REQUEST_PRESIGNED_URL',
      status: 'FAILURE',
      description: `Error generating presigned URL: ${error.message}`,
      req,
    });
    return NextResponse.json({
      success: false,
      message: "Failed to generate presigned URL",
      error: error.message,
    }, { status: 500 });
  }
});
