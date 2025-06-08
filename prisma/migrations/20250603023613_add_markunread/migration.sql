-- CreateTable
CREATE TABLE "ProjectMessageRead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectMessageRead_userId_idx" ON "ProjectMessageRead"("userId");

-- CreateIndex
CREATE INDEX "ProjectMessageRead_messageId_idx" ON "ProjectMessageRead"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMessageRead_messageId_userId_key" ON "ProjectMessageRead"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "ProjectMessageRead" ADD CONSTRAINT "ProjectMessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ProjectMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMessageRead" ADD CONSTRAINT "ProjectMessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
