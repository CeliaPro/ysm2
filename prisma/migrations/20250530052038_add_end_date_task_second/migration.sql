-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);
