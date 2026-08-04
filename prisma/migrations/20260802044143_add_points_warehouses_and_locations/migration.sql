-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "pointId" TEXT,
    "supplierName" TEXT,
    "note" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "postedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Purchase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Purchase_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Purchase" ("createdAt", "id", "note", "organizationId", "paymentMethod", "postedAt", "receiptNumber", "supplierName", "updatedAt") SELECT "createdAt", "id", "note", "organizationId", "paymentMethod", "postedAt", "receiptNumber", "supplierName", "updatedAt" FROM "Purchase";
DROP TABLE "Purchase";
ALTER TABLE "new_Purchase" RENAME TO "Purchase";
CREATE UNIQUE INDEX "Purchase_receiptNumber_key" ON "Purchase"("receiptNumber");
CREATE TABLE "new_PurchaseItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseCellId" TEXT,
    "qty" DECIMAL NOT NULL,
    "unitCost" DECIMAL NOT NULL,
    CONSTRAINT "PurchaseItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Purchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseItem_warehouseCellId_fkey" FOREIGN KEY ("warehouseCellId") REFERENCES "WarehouseCell" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseItem" ("id", "productId", "qty", "receiptId", "unitCost") SELECT "id", "productId", "qty", "receiptId", "unitCost" FROM "PurchaseItem";
DROP TABLE "PurchaseItem";
ALTER TABLE "new_PurchaseItem" RENAME TO "PurchaseItem";
CREATE TABLE "new_Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cashierId" TEXT,
    "pointId" TEXT,
    "totalAmount" DECIMAL NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sale_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Sale_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sale" ("cashierId", "createdAt", "id", "organizationId", "paymentMethod", "saleNumber", "totalAmount") SELECT "cashierId", "createdAt", "id", "organizationId", "paymentMethod", "saleNumber", "totalAmount" FROM "Sale";
DROP TABLE "Sale";
ALTER TABLE "new_Sale" RENAME TO "Sale";
CREATE UNIQUE INDEX "Sale_saleNumber_key" ON "Sale"("saleNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
