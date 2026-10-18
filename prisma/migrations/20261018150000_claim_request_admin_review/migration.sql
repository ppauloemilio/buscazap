-- DropTable
DROP TABLE IF EXISTS "ProviderClaimChallenge";

-- CreateTable
CREATE TABLE "ProviderClaimRequest" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderClaimRequest_status_createdAt_idx" ON "ProviderClaimRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderClaimRequest_providerId_status_idx" ON "ProviderClaimRequest"("providerId", "status");

-- AddForeignKey
ALTER TABLE "ProviderClaimRequest" ADD CONSTRAINT "ProviderClaimRequest_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
