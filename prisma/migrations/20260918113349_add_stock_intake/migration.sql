-- DropIndex
DROP INDEX "Sale_cashierId_idx";

-- CreateTable
CREATE TABLE "StockIntake" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pointId" TEXT,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockIntakeItem" (
    "id" TEXT NOT NULL,
    "intakeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseCellId" TEXT NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL,
    "unitCost" DECIMAL(14,2),

    CONSTRAINT "StockIntakeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockIntake_number_key" ON "StockIntake"("number");

-- CreateIndex
CREATE INDEX "StockIntake_organizationId_createdAt_idx" ON "StockIntake"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "StockIntake" ADD CONSTRAINT "StockIntake_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIntake" ADD CONSTRAINT "StockIntake_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIntakeItem" ADD CONSTRAINT "StockIntakeItem_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "StockIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIntakeItem" ADD CONSTRAINT "StockIntakeItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockIntakeItem" ADD CONSTRAINT "StockIntakeItem_warehouseCellId_fkey" FOREIGN KEY ("warehouseCellId") REFERENCES "WarehouseCell"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
