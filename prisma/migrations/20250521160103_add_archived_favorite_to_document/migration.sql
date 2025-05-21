/*
  Warnings:

  - Added the required column `archived` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `favorite` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "archived" BOOLEAN NOT NULL,
ADD COLUMN     "favorite" BOOLEAN NOT NULL;
