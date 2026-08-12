-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WriteOff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "writeOffNumber" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reason" TEXT,
    "totalAmount" DECIMAL NOT NULL,
    "createdBy" TEXT,
    "pointId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WriteOff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WriteOff_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WriteOff" ("createdAt", "createdBy", "id", "organizationId", "reason", "totalAmount", "writeOffNumber") SELECT "createdAt", "createdBy", "id", "organizationId", "reason", "totalAmount", "writeOffNumber" FROM "WriteOff";
DROP TABLE "WriteOff";
ALTER TABLE "new_WriteOff" RENAME TO "WriteOff";
CREATE UNIQUE INDEX "WriteOff_writeOffNumber_key" ON "WriteOff"("writeOffNumber");
CREATE INDEX "WriteOff_organizationId_createdAt_idx" ON "WriteOff"("organizationId", "createdAt");
CREATE INDEX "WriteOff_organizationId_pointId_idx" ON "WriteOff"("organizationId", "pointId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
