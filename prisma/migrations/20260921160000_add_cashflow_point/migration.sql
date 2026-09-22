-- AlterTable
ALTER TABLE "CashFlow" ADD COLUMN     "pointId" TEXT;

-- CreateIndex
CREATE INDEX "CashFlow_organizationId_pointId_createdAt_idx" ON "CashFlow"("organizationId", "pointId", "createdAt");

-- AddForeignKey
ALTER TABLE "CashFlow" ADD CONSTRAINT "CashFlow_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point"("id") ON DELETE SET NULL ON UPDATE CASCADE;
