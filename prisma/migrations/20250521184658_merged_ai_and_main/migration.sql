/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Invite` table. All the data in the column will be lost.
  - You are about to drop the column `used` on the `Invite` table. All the data in the column will be lost.
  - You are about to drop the column `accessKey` on the `Storage` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Storage` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `Storage` table. All the data in the column will be lost.
  - You are about to drop the column `secretKey` on the `Storage` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Storage` table. All the data in the column will be lost.
  - The `user_role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `ChatDocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChatMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChatSession` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `Invite` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ChatDocument" DROP CONSTRAINT "ChatDocument_documentId_fkey";

-- DropForeignKey
ALTER TABLE "ChatDocument" DROP CONSTRAINT "ChatDocument_messageId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "ChatSession" DROP CONSTRAINT "ChatSession_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ChatSession" DROP CONSTRAINT "ChatSession_userId_fkey";

-- DropIndex
DROP INDEX "Document_projectId_idx";

-- DropIndex
DROP INDEX "Document_userId_idx";

-- DropIndex
DROP INDEX "Project_name_idx";

-- DropIndex
DROP INDEX "ProjectMember_projectId_idx";

-- DropIndex
DROP INDEX "ProjectMember_userId_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "isDeleted",
DROP COLUMN "uploadedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "archived" SET DEFAULT false,
ALTER COLUMN "favorite" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Invite" DROP COLUMN "expiresAt",
DROP COLUMN "used",
ADD COLUMN     "role" "Role" NOT NULL;

-- AlterTable
ALTER TABLE "Storage" DROP COLUMN "accessKey",
DROP COLUMN "createdAt",
DROP COLUMN "region",
DROP COLUMN "secretKey",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "StoragePolicy" ADD COLUMN     "retentionDays" INTEGER,
ALTER COLUMN "allowedTypes" DROP NOT NULL,
ALTER COLUMN "allowedTypes" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
ALTER COLUMN "name" DROP NOT NULL,
DROP COLUMN "user_role",
ADD COLUMN     "user_role" TEXT,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "isDeleted" DROP NOT NULL,
ALTER COLUMN "isDeleted" DROP DEFAULT;

-- DropTable
DROP TABLE "ChatDocument";

-- DropTable
DROP TABLE "ChatMessage";

-- DropTable
DROP TABLE "ChatSession";

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "liked" BOOLEAN DEFAULT false,
    "disliked" BOOLEAN DEFAULT false,
    "embeddingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "conversationId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Tag_name_key" RENAME TO "Tag_name_unique";
