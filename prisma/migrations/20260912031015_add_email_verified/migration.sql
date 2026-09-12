-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "resetCode" TEXT,
ADD COLUMN     "resetCodeExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationCode" TEXT,
ADD COLUMN     "verificationCodeExpiry" TIMESTAMP(3);
