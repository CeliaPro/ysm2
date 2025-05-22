import { withAuthentication } from "@/app/utils/auth.utils";
import { generatePresignedUrl } from "@/app/utils/s3.utils";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const POST = withAuthentication(async (req)=>{
    const {contentType} = await req.json()
    if (!contentType) {
        return NextResponse.json({
            success: false,
            message: "Missing name or type",
        }, { status: 400 })
    }
    const keyZehwani= randomUUID()
    const presignedUrl = await generatePresignedUrl('docs/' + keyZehwani, contentType)
    return {
        success: true,
        key: keyZehwani,
        message: "File presigned url generated successfully",
        presignedUrl
    }
})