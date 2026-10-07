-- CreateTable
CREATE TABLE "ProviderImage" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderImage_providerId_sortOrder_idx" ON "ProviderImage"("providerId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ProviderImage" ADD CONSTRAINT "ProviderImage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
