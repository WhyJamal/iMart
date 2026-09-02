-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CASHIER',
    "locale" TEXT NOT NULL DEFAULT 'ru',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT,
    "pointId" TEXT,
    "workScheduleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_workScheduleId_fkey" FOREIGN KEY ("workScheduleId") REFERENCES "WorkSchedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "organizationId", "password", "pointId", "role", "updatedAt", "workScheduleId") SELECT "createdAt", "email", "id", "name", "organizationId", "password", "pointId", "role", "updatedAt", "workScheduleId" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
