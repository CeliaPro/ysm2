/*
  Warnings:

  - Made the column `startDate` on table `Task` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "startDate" SET NOT NULL;
