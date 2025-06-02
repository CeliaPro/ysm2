/*
  Warnings:

  - Made the column `expiresAt` on table `Session` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "expiresAt" SET NOT NULL;
