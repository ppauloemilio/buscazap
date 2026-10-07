-- AlterTable
ALTER TABLE "Advertisement" ADD COLUMN IF NOT EXISTS "streetAddress" TEXT;
ALTER TABLE "Advertisement" ADD COLUMN IF NOT EXISTS "instagram" TEXT;
ALTER TABLE "Advertisement" ADD COLUMN IF NOT EXISTS "website" TEXT;
ALTER TABLE "Advertisement" ADD COLUMN IF NOT EXISTS "businessHoursJson" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AdvertisementProduct" (
    "id" TEXT NOT NULL,
    "advertisementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvertisementProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AdvertisementService" (
    "id" TEXT NOT NULL,
    "advertisementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceFrom" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvertisementService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdvertisementProduct_advertisementId_sortOrder_idx" ON "AdvertisementProduct"("advertisementId", "sortOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdvertisementService_advertisementId_sortOrder_idx" ON "AdvertisementService"("advertisementId", "sortOrder");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AdvertisementProduct_advertisementId_fkey'
  ) THEN
    ALTER TABLE "AdvertisementProduct"
      ADD CONSTRAINT "AdvertisementProduct_advertisementId_fkey"
      FOREIGN KEY ("advertisementId") REFERENCES "Advertisement"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AdvertisementService_advertisementId_fkey'
  ) THEN
    ALTER TABLE "AdvertisementService"
      ADD CONSTRAINT "AdvertisementService_advertisementId_fkey"
      FOREIGN KEY ("advertisementId") REFERENCES "Advertisement"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
