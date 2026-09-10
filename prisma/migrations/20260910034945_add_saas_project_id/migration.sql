/*
  Warnings:

  - A unique constraint covering the columns `[saasProjectId]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "saasProjectId" TEXT,
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "saasUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_saasProjectId_key" ON "Organization"("saasProjectId");
