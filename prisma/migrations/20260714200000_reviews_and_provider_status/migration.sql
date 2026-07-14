-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "businessHours" TEXT;
ALTER TABLE "Provider" ADD COLUMN "responseHint" TEXT;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "advertisementId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_advertisementId_idx" ON "Review"("advertisementId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_advertisementId_fkey" FOREIGN KEY ("advertisementId") REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
