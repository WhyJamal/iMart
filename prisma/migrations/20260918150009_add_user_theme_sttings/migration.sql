-- CreateTable
CREATE TABLE "UserThemeSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'system',
    "primary" TEXT NOT NULL DEFAULT 'red',
    "radius" TEXT NOT NULL DEFAULT 'medium',

    CONSTRAINT "UserThemeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserThemeSettings_userId_key" ON "UserThemeSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserThemeSettings" ADD CONSTRAINT "UserThemeSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
