-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIF', 'EN_ATTENTE', 'TERMINE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('A_FAIRE', 'EN_COURS', 'TERMINEE');

-- CreateEnum
CREATE TYPE "TaskSeverity" AS ENUM ('FAIBLE', 'MOYENNE', 'HAUTE', 'CRITIQUE');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIF';

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee" TEXT NOT NULL,
    "severity" "TaskSeverity" NOT NULL DEFAULT 'MOYENNE',
    "status" "TaskStatus" NOT NULL DEFAULT 'A_FAIRE',
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
