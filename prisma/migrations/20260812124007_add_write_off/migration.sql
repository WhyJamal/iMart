-- CreateTable
CREATE TABLE "WriteOff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "writeOffNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reason" TEXT,
    "totalAmount" DECIMAL NOT NULL,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WriteOff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WriteOffItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "writeOffId" TEXT NOT NULL,
    "warehouseCellId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL NOT NULL,
    "unitCost" DECIMAL NOT NULL,
    CONSTRAINT "WriteOffItem_writeOffId_fkey" FOREIGN KEY ("writeOffId") REFERENCES "WriteOff" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WriteOffItem_warehouseCellId_fkey" FOREIGN KEY ("warehouseCellId") REFERENCES "WarehouseCell" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WriteOffItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WriteOff_writeOffNumber_key" ON "WriteOff"("writeOffNumber");

-- CreateIndex
CREATE INDEX "WriteOff_organizationId_createdAt_idx" ON "WriteOff"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "WriteOffItem_writeOffId_idx" ON "WriteOffItem"("writeOffId");

-- CreateIndex
CREATE INDEX "WriteOffItem_warehouseCellId_idx" ON "WriteOffItem"("warehouseCellId");
