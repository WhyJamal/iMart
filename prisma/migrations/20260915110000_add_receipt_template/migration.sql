-- CreateTable
CREATE TABLE "ReceiptTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "showProductName" BOOLEAN NOT NULL DEFAULT true,
    "showQty" BOOLEAN NOT NULL DEFAULT true,
    "showUnit" BOOLEAN NOT NULL DEFAULT true,
    "showUnitPrice" BOOLEAN NOT NULL DEFAULT true,
    "showLineTotal" BOOLEAN NOT NULL DEFAULT true,
    "totalAlign" TEXT NOT NULL DEFAULT 'right',
    "headerText" TEXT,
    "footerText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReceiptTemplate_organizationId_idx" ON "ReceiptTemplate"("organizationId");

-- AddForeignKey
ALTER TABLE "ReceiptTemplate" ADD CONSTRAINT "ReceiptTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
