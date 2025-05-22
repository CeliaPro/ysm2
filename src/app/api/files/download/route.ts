import { withAuthentication } from "@/app/utils/auth.utils";
import { generateDownloadUrl } from "@/app/utils/s3.utils";
import { NextResponse } from "next/server";

export const POST = withAuthentication(async (req)=>{
    const {key} = await req.json()
    if (!key) {
        return NextResponse.json({
            success: false,
            message: "Missing zho key",
        }, { status: 400 })
    }
    const presignedUrl = await generateDownloadUrl('docs/' + key)
    return {
        success: true,
        message: "File presigned url generated successfully",
        presignedUrl
    }
})