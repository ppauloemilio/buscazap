-- AlterTable
ALTER TABLE "HomepageSetting" ADD COLUMN "showPremiumAds" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "HomepageSetting" ADD COLUMN "showPaidAds" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "HomepageSetting" ADD COLUMN "showFreeAds" BOOLEAN NOT NULL DEFAULT true;

-- Expand legacy "advertisements" block into premium/paid/free in saved order
UPDATE "HomepageSetting"
SET "sectionOrderJson" = REPLACE(
  "sectionOrderJson",
  '"advertisements"',
  '"premiumAds","paidAds","freeAds"'
)
WHERE "sectionOrderJson" LIKE '%"advertisements"%';
