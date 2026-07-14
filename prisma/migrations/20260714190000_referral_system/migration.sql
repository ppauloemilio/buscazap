-- AlterTable Provider: referral fields
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "freePremiumCredits" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "referredById" TEXT;

-- Backfill unique referral codes for existing providers
UPDATE "Provider"
SET "referralCode" = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || ID) FROM 1 FOR 8))
WHERE "referralCode" IS NULL;

ALTER TABLE "Provider" ALTER COLUMN "referralCode" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Provider_referralCode_key" ON "Provider"("referralCode");

ALTER TABLE "Provider" DROP CONSTRAINT IF EXISTS "Provider_referredById_fkey";
ALTER TABLE "Provider"
  ADD CONSTRAINT "Provider_referredById_fkey"
  FOREIGN KEY ("referredById") REFERENCES "Provider"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable PremiumBoost: optional payment + source
ALTER TABLE "PremiumBoost" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'PAID';
ALTER TABLE "PremiumBoost" ALTER COLUMN "amount" SET DEFAULT 0;
ALTER TABLE "PremiumBoost" ALTER COLUMN "paymentId" DROP NOT NULL;

-- CreateTable Referral
CREATE TABLE IF NOT EXISTS "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Referral_referredId_key" ON "Referral"("referredId");
CREATE INDEX IF NOT EXISTS "Referral_referrerId_createdAt_idx" ON "Referral"("referrerId", "createdAt");

ALTER TABLE "Referral" DROP CONSTRAINT IF EXISTS "Referral_referrerId_fkey";
ALTER TABLE "Referral"
  ADD CONSTRAINT "Referral_referrerId_fkey"
  FOREIGN KEY ("referrerId") REFERENCES "Provider"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Referral" DROP CONSTRAINT IF EXISTS "Referral_referredId_fkey";
ALTER TABLE "Referral"
  ADD CONSTRAINT "Referral_referredId_fkey"
  FOREIGN KEY ("referredId") REFERENCES "Provider"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
