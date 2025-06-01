import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucketName = 'ysm-ensam'
const s3 = new S3Client({ region: "us-east-1" });

export async function generatePresignedUrl(fileKey: string, fileType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: fileType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return url;
}

export async function generateDownloadUrl(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour expiry
  return signedUrl;
}
    export async function deleteFromS3(fileKey: string): Promise<void> {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      })
      await s3.send(command)
}