-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "updatedById" TEXT;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
