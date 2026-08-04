/*
  Warnings:

  - You are about to drop the column `supplierName` on the `Purchase` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Contragent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SUPPLIER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contragent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pointId" TEXT,
    "contragentId" TEXT,
    "note" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "postedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Purchase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Purchase_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Purchase_contragentId_fkey" FOREIGN KEY ("contragentId") REFERENCES "Contragent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Purchase" ("createdAt", "id", "note", "organizationId", "paymentMethod", "pointId", "postedAt", "receiptNumber", "updatedAt") SELECT "createdAt", "id", "note", "organizationId", "paymentMethod", "pointId", "postedAt", "receiptNumber", "updatedAt" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
CREATE UNIQUE INDEX "Purchase_receiptNumber_key" ON "Purchase"("receiptNumber");
CREATE TABLE "new_SaleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseCellId" TEXT,
    "qty" DECIMAL NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SaleItem_warehouseCellId_fkey" FOREIGN KEY ("warehouseCellId") REFERENCES "WarehouseCell" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SaleItem" ("id", "productId", "qty", "saleId", "unitPrice") SELECT "id", "productId", "qty", "saleId", "unitPrice" FROM "SaleItem";
DROP TABLE "SaleItem";
ALTER TABLE "new_SaleItem" RENAME TO "SaleItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Contragent_organizationId_type_idx" ON "Contragent"("organizationId", "type");
