/*
  Warnings:

  - You are about to drop the `activity_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_configurations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_prompts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `document_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `s3_buckets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `storage_access_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `storage_policies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'MANAGER', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_document_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_project_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_configurations" DROP CONSTRAINT "ai_configurations_created_by_fkey";

-- DropForeignKey
ALTER TABLE "ai_conversations" DROP CONSTRAINT "ai_conversations_document_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_conversations" DROP CONSTRAINT "ai_conversations_project_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_conversations" DROP CONSTRAINT "ai_conversations_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_messages" DROP CONSTRAINT "ai_messages_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_prompts" DROP CONSTRAINT "ai_prompts_configuration_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_prompts" DROP CONSTRAINT "ai_prompts_created_by_fkey";

-- DropForeignKey
ALTER TABLE "document_tags" DROP CONSTRAINT "document_tags_document_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_project_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "project_members" DROP CONSTRAINT "project_members_project_id_fkey";

-- DropForeignKey
ALTER TABLE "project_members" DROP CONSTRAINT "project_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "storage_access_logs" DROP CONSTRAINT "storage_access_logs_document_id_fkey";

-- DropForeignKey
ALTER TABLE "storage_access_logs" DROP CONSTRAINT "storage_access_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "storage_policies" DROP CONSTRAINT "storage_policies_project_id_fkey";

-- DropTable
DROP TABLE "activity_logs";

-- DropTable
DROP TABLE "ai_configurations";

-- DropTable
DROP TABLE "ai_conversations";

-- DropTable
DROP TABLE "ai_messages";

-- DropTable
DROP TABLE "ai_prompts";

-- DropTable
DROP TABLE "document_tags";

-- DropTable
DROP TABLE "documents";

-- DropTable
DROP TABLE "project_members";

-- DropTable
DROP TABLE "projects";

-- DropTable
DROP TABLE "s3_buckets";

-- DropTable
DROP TABLE "storage_access_logs";

-- DropTable
DROP TABLE "storage_policies";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "access_level";

-- DropEnum
DROP TYPE "access_type";

-- DropEnum
DROP TYPE "action_type";

-- DropEnum
DROP TYPE "ai_purpose";

-- DropEnum
DROP TYPE "ai_role";

-- DropEnum
DROP TYPE "project_role";

-- DropEnum
DROP TYPE "storage_provider";

-- DropEnum
DROP TYPE "user_role";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "user_role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storageId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Storage" (
    "id" TEXT NOT NULL,
    "s3Bucket" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "accessKey" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoragePolicy" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "maxSizeMb" INTEGER NOT NULL,
    "allowedTypes" TEXT[],

    CONSTRAINT "StoragePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatDocument" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "ChatDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DocumentTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DocumentTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Project_name_idx" ON "Project"("name");

-- CreateIndex
CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_userId_projectId_key" ON "ProjectMember"("userId", "projectId");

-- CreateIndex
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Storage_s3Bucket_idx" ON "Storage"("s3Bucket");

-- CreateIndex
CREATE UNIQUE INDEX "StoragePolicy_projectId_key" ON "StoragePolicy"("projectId");

-- CreateIndex
CREATE INDEX "ChatSession_userId_idx" ON "ChatSession"("userId");

-- CreateIndex
CREATE INDEX "ChatSession_projectId_idx" ON "ChatSession"("projectId");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatDocument_messageId_documentId_key" ON "ChatDocument"("messageId", "documentId");

-- CreateIndex
CREATE INDEX "_DocumentTags_B_index" ON "_DocumentTags"("B");

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "Storage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoragePolicy" ADD CONSTRAINT "StoragePolicy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatDocument" ADD CONSTRAINT "ChatDocument_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatDocument" ADD CONSTRAINT "ChatDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentTags" ADD CONSTRAINT "_DocumentTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentTags" ADD CONSTRAINT "_DocumentTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
