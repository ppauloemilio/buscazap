-- Plano Plus, promoções por provider e toggle admin
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT NOT NULL DEFAULT 'BASIC';

ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS "plusPlanEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "ProviderPromotion" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "priceOriginal" DOUBLE PRECISION NOT NULL,
    "pricePromo" DOUBLE PRECISION NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderPromotion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProviderPromotion_providerId_sortOrder_idx" ON "ProviderPromotion"("providerId", "sortOrder");

ALTER TABLE "ProviderPromotion" DROP CONSTRAINT IF EXISTS "ProviderPromotion_providerId_fkey";
ALTER TABLE "ProviderPromotion" ADD CONSTRAINT "ProviderPromotion_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
