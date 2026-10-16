-- AlterTable
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "mpRecurringId" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "mpRecurringStatus" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "mpRecurringTier" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "mpRecurringUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Provider_mpRecurringId_key" ON "Provider"("mpRecurringId");
