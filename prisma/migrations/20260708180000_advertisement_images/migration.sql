-- CreateTable
CREATE TABLE "AdvertisementImage" (
    "id" TEXT NOT NULL,
    "advertisementId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'GALLERY',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvertisementImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdvertisementImage_advertisementId_kind_idx" ON "AdvertisementImage"("advertisementId", "kind");

-- AddForeignKey
ALTER TABLE "AdvertisementImage" ADD CONSTRAINT "AdvertisementImage_advertisementId_fkey" FOREIGN KEY ("advertisementId") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
