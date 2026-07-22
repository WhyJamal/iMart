-- CreateTable
CREATE TABLE "SalaryRegister" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "salaryType" TEXT NOT NULL,
    "rate" DECIMAL NOT NULL,
    "effectiveFrom" DATETIME NOT NULL,
    "reason" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalaryRegister_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalaryRegister_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayrollPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "salaryType" TEXT NOT NULL,
    "rate" DECIMAL NOT NULL,
    "workedUnits" DECIMAL,
    "bonus" DECIMAL NOT NULL DEFAULT 0,
    "deduction" DECIMAL NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cash',
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayrollPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SalaryRegister_organizationId_userId_effectiveFrom_idx" ON "SalaryRegister"("organizationId", "userId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "PayrollPayment_organizationId_userId_createdAt_idx" ON "PayrollPayment"("organizationId", "userId", "createdAt");
