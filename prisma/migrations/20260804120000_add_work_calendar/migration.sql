-- CreateTable
CREATE TABLE "WorkCalendar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "standardHours" DECIMAL NOT NULL DEFAULT 8,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" DATETIME,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkCalendar_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkCalendarDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calendarId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "dayType" TEXT NOT NULL,
    "title" TEXT,
    "shortenedBy" DECIMAL,
    CONSTRAINT "WorkCalendarDay_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "WorkCalendar" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WorkCalendar_organizationId_year_idx" ON "WorkCalendar"("organizationId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "WorkCalendar_organizationId_year_key" ON "WorkCalendar"("organizationId", "year");

-- CreateIndex
CREATE INDEX "WorkCalendarDay_calendarId_date_idx" ON "WorkCalendarDay"("calendarId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkCalendarDay_calendarId_date_key" ON "WorkCalendarDay"("calendarId", "date");
