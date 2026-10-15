-- CreateTable
CREATE TABLE "ProviderCoupon" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "badgeLabel" TEXT NOT NULL,
    "quantityTotal" INTEGER NOT NULL,
    "quantityRemaining" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "HomepageSetting" ADD COLUMN "showCoupons" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ProviderCoupon_providerId_sortOrder_idx" ON "ProviderCoupon"("providerId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProviderCoupon_isEnabled_endsAt_idx" ON "ProviderCoupon"("isEnabled", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "CouponRedemption_code_key" ON "CouponRedemption"("code");

-- CreateIndex
CREATE INDEX "CouponRedemption_couponId_status_idx" ON "CouponRedemption"("couponId", "status");

-- CreateIndex
CREATE INDEX "CouponRedemption_issuedAt_idx" ON "CouponRedemption"("issuedAt");

-- AddForeignKey
ALTER TABLE "ProviderCoupon" ADD CONSTRAINT "ProviderCoupon_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "ProviderCoupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
