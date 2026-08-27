/*
  Warnings:

  - Added the required column `warehouseCellId` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Promotion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "warehouseCellId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discountPercent" DECIMAL NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Promotion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Promotion_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Promotion_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Promotion_warehouseCellId_fkey" FOREIGN KEY ("warehouseCellId") REFERENCES "WarehouseCell" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Promotion" ("comment", "createdAt", "discountPercent", "endsAt", "id", "name", "organizationId", "pointId", "updatedAt", "warehouseId") SELECT "comment", "createdAt", "discountPercent", "endsAt", "id", "name", "organizationId", "pointId", "updatedAt", "warehouseId" FROM "Promotion";
DROP TABLE "Promotion";
ALTER TABLE "new_Promotion" RENAME TO "Promotion";
CREATE INDEX "Promotion_organizationId_pointId_warehouseId_warehouseCellId_idx" ON "Promotion"("organizationId", "pointId", "warehouseId", "warehouseCellId");
CREATE INDEX "Promotion_warehouseCellId_endsAt_idx" ON "Promotion"("warehouseCellId", "endsAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
