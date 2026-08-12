-- CreateTable
CREATE TABLE "Timesheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Timesheet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Timesheet_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimesheetEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timesheetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "hours" DECIMAL NOT NULL DEFAULT 0,
    "dayKind" TEXT NOT NULL,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TimesheetEntry_timesheetId_fkey" FOREIGN KEY ("timesheetId") REFERENCES "Timesheet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimesheetEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Timesheet_organizationId_year_month_idx" ON "Timesheet"("organizationId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Timesheet_pointId_year_month_key" ON "Timesheet"("pointId", "year", "month");

-- CreateIndex
CREATE INDEX "TimesheetEntry_timesheetId_userId_idx" ON "TimesheetEntry"("timesheetId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TimesheetEntry_timesheetId_userId_date_key" ON "TimesheetEntry"("timesheetId", "userId", "date");
