-- CreateTable
CREATE TABLE "WorkScheduleTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkScheduleTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkScheduleTemplateDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "workHours" DECIMAL NOT NULL DEFAULT 0,
    "breakHours" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "WorkScheduleTemplateDay_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkScheduleTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "templateId" TEXT NOT NULL,
    "workCalendarId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkSchedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkSchedule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkScheduleTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkSchedule_workCalendarId_fkey" FOREIGN KEY ("workCalendarId") REFERENCES "WorkCalendar" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkScheduleDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scheduleId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "hours" DECIMAL NOT NULL DEFAULT 0,
    "dayKind" TEXT NOT NULL,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "WorkScheduleDay_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "WorkSchedule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CASHIER',
    "organizationId" TEXT,
    "pointId" TEXT,
    "workScheduleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_workScheduleId_fkey" FOREIGN KEY ("workScheduleId") REFERENCES "WorkSchedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "organizationId", "password", "pointId", "role", "updatedAt") SELECT "createdAt", "email", "id", "name", "organizationId", "password", "pointId", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WorkScheduleTemplate_organizationId_idx" ON "WorkScheduleTemplate"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkScheduleTemplateDay_templateId_dayOfWeek_key" ON "WorkScheduleTemplateDay"("templateId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "WorkSchedule_organizationId_year_idx" ON "WorkSchedule"("organizationId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "WorkSchedule_organizationId_name_year_key" ON "WorkSchedule"("organizationId", "name", "year");

-- CreateIndex
CREATE INDEX "WorkScheduleDay_scheduleId_date_idx" ON "WorkScheduleDay"("scheduleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkScheduleDay_scheduleId_date_key" ON "WorkScheduleDay"("scheduleId", "date");
