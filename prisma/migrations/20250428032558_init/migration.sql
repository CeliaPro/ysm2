-- CreateEnum
CREATE TYPE "access_level" AS ENUM ('public', 'private', 'project');

-- CreateEnum
CREATE TYPE "access_type" AS ENUM ('view', 'download', 'upload', 'delete');

-- CreateEnum
CREATE TYPE "action_type" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "ai_purpose" AS ENUM ('document_summary', 'content_generation');

-- CreateEnum
CREATE TYPE "ai_role" AS ENUM ('user', 'assistant');

-- CreateEnum
CREATE TYPE "project_role" AS ENUM ('owner', 'editor', 'viewer');

-- CreateEnum
CREATE TYPE "storage_provider" AS ENUM ('local', 's3');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'project_manager', 'employee');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "storage_limit" BIGINT DEFAULT 0,
    "is_archived" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "user_id" INTEGER,
    "role" "project_role" NOT NULL,
    "joined_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "file_path" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "file_type" VARCHAR(50),
    "uploaded_by" INTEGER,
    "uploaded_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_archived" BOOLEAN DEFAULT false,
    "storage_provider" "storage_provider" NOT NULL,
    "s3_bucket_name" VARCHAR(255),
    "s3_object_key" VARCHAR(255),
    "s3_region" VARCHAR(100),
    "content_type" VARCHAR(100),
    "public_url" TEXT,
    "access_level" "access_level" NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_tags" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER,
    "tag_name" VARCHAR(255) NOT NULL,

    CONSTRAINT "document_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "s3_buckets" (
    "id" SERIAL NOT NULL,
    "bucket_name" VARCHAR(255) NOT NULL,
    "region" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,
    "description" TEXT,

    CONSTRAINT "s3_buckets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_policies" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "max_file_size" BIGINT DEFAULT 104857600,
    "allowed_file_types" TEXT[],
    "retention_period" INTEGER DEFAULT 30,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_access_logs" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER,
    "user_id" INTEGER,
    "access_type" "access_type" NOT NULL,
    "access_timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ip_address" INET NOT NULL,
    "success" BOOLEAN DEFAULT true,

    CONSTRAINT "storage_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "project_id" INTEGER,
    "document_id" INTEGER,
    "action_type" "action_type" NOT NULL,
    "action_details" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_prompts" (
    "id" SERIAL NOT NULL,
    "configuration_id" INTEGER,
    "prompt_text" TEXT NOT NULL,
    "purpose" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,

    CONSTRAINT "ai_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "project_id" INTEGER,
    "document_id" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER,
    "role" "ai_role" NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "tokens_used" INTEGER DEFAULT 0,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_configurations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "max_tokens" INTEGER DEFAULT 1000,
    "temperature" DOUBLE PRECISION DEFAULT 0.7,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "ai_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "s3_buckets_bucket_name_key" ON "s3_buckets"("bucket_name");

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "document_tags" ADD CONSTRAINT "document_tags_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "storage_policies" ADD CONSTRAINT "storage_policies_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "storage_access_logs" ADD CONSTRAINT "storage_access_logs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "storage_access_logs" ADD CONSTRAINT "storage_access_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_configuration_id_fkey" FOREIGN KEY ("configuration_id") REFERENCES "ai_configurations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_configurations" ADD CONSTRAINT "ai_configurations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
