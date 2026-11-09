-- AlterTable HomepageSetting
ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS "showAdvertiserOffers" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PricingSetting" (
    "id" TEXT NOT NULL,
    "subscriptionAmount" DOUBLE PRECISION NOT NULL DEFAULT 9.99,
    "subscriptionPlusAmount" DOUBLE PRECISION NOT NULL DEFAULT 14.99,
    "extraWhatsappAmount" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "extraAdAmount" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "premiumBoostAmount" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCoupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "badgeLabel" TEXT NOT NULL,
    "targetFeature" TEXT NOT NULL,
    "discountKind" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantityTotal" INTEGER NOT NULL,
    "quantityRemaining" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "citiesJson" TEXT NOT NULL DEFAULT '[]',
    "onePerProvider" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "paymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "BillingCouponRedemption_pkey" PRIMARY KEY ("id")
);

-- AlterTable Payment
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "amountOriginal" DOUBLE PRECISION;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "billingCouponId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "billingCouponCode" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "discountKind" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "discountValue" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "BillingCoupon_code_key" ON "BillingCoupon"("code");

-- CreateIndex
CREATE INDEX "BillingCoupon_isEnabled_isPublic_endsAt_idx" ON "BillingCoupon"("isEnabled", "isPublic", "endsAt");

-- CreateIndex
CREATE INDEX "BillingCoupon_targetFeature_isEnabled_idx" ON "BillingCoupon"("targetFeature", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCouponRedemption_paymentId_key" ON "BillingCouponRedemption"("paymentId");

-- CreateIndex
CREATE INDEX "BillingCouponRedemption_couponId_status_idx" ON "BillingCouponRedemption"("couponId", "status");

-- CreateIndex
CREATE INDEX "BillingCouponRedemption_providerId_couponId_idx" ON "BillingCouponRedemption"("providerId", "couponId");

-- CreateIndex
CREATE INDEX "Payment_billingCouponId_idx" ON "Payment"("billingCouponId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billingCouponId_fkey" FOREIGN KEY ("billingCouponId") REFERENCES "BillingCoupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCouponRedemption" ADD CONSTRAINT "BillingCouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "BillingCoupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCouponRedemption" ADD CONSTRAINT "BillingCouponRedemption_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCouponRedemption" ADD CONSTRAINT "BillingCouponRedemption_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default pricing row
INSERT INTO "PricingSetting" ("id", "subscriptionAmount", "subscriptionPlusAmount", "extraWhatsappAmount", "extraAdAmount", "premiumBoostAmount", "updatedAt")
VALUES ('default', 9.99, 14.99, 3, 10, 5, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
