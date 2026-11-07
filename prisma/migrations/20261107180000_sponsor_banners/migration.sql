-- AlterTable
ALTER TABLE "HomepageSetting" ADD COLUMN "showSponsorBanners" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SponsorBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorBanner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SponsorBanner_isActive_sortOrder_idx" ON "SponsorBanner"("isActive", "sortOrder");
