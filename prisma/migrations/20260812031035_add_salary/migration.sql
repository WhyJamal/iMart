-- CreateTable
CREATE TABLE "PayrollAccrual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "pointId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PayrollAccrual_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollAccrual_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "Point" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollAccrualLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accrualId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "salaryType" TEXT NOT NULL,
    "rate" DECIMAL NOT NULL,
    "workedUnits" DECIMAL,
    "grossAmount" DECIMAL NOT NULL DEFAULT 0,
    "alreadyPaid" DECIMAL NOT NULL DEFAULT 0,
    "bonus" DECIMAL NOT NULL DEFAULT 0,
    "deduction" DECIMAL NOT NULL DEFAULT 0,
    "payAmount" DECIMAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    CONSTRAINT "PayrollAccrualLine_accrualId_fkey" FOREIGN KEY ("accrualId") REFERENCES "PayrollAccrual" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollAccrualLine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PayrollAccrual_organizationId_pointId_year_month_idx" ON "PayrollAccrual"("organizationId", "pointId", "year", "month");

-- CreateIndex
CREATE INDEX "PayrollAccrualLine_accrualId_userId_idx" ON "PayrollAccrualLine"("accrualId", "userId");
