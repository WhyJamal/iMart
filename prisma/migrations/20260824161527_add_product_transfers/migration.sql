-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transferNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromPointId" TEXT NOT NULL,
    "toPointId" TEXT NOT NULL,
    "note" TEXT,
    "totalAmount" DECIMAL NOT NULL,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transfer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transfer_fromPointId_fkey" FOREIGN KEY ("fromPointId") REFERENCES "Point" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transfer_toPointId_fkey" FOREIGN KEY ("toPointId") REFERENCES "Point" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransferItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fromCellId" TEXT NOT NULL,
    "toCellId" TEXT NOT NULL,
    "qty" DECIMAL NOT NULL,
    "unitCost" DECIMAL NOT NULL,
    CONSTRAINT "TransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransferItem_fromCellId_fkey" FOREIGN KEY ("fromCellId") REFERENCES "WarehouseCell" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransferItem_toCellId_fkey" FOREIGN KEY ("toCellId") REFERENCES "WarehouseCell" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_transferNumber_key" ON "Transfer"("transferNumber");

-- CreateIndex
CREATE INDEX "Transfer_organizationId_createdAt_idx" ON "Transfer"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Transfer_organizationId_fromPointId_idx" ON "Transfer"("organizationId", "fromPointId");

-- CreateIndex
CREATE INDEX "Transfer_organizationId_toPointId_idx" ON "Transfer"("organizationId", "toPointId");

-- CreateIndex
CREATE INDEX "TransferItem_transferId_idx" ON "TransferItem"("transferId");

-- CreateIndex
CREATE INDEX "TransferItem_fromCellId_idx" ON "TransferItem"("fromCellId");

-- CreateIndex
CREATE INDEX "TransferItem_toCellId_idx" ON "TransferItem"("toCellId");
