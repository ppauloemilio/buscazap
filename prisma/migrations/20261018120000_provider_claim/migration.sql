-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "claimToken" TEXT;
ALTER TABLE "Provider" ADD COLUMN "claimTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "Provider" ADD COLUMN "claimVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_claimToken_key" ON "Provider"("claimToken");

-- CreateTable
CREATE TABLE "ProviderClaimChallenge" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderClaimChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderClaimChallenge_providerId_createdAt_idx" ON "ProviderClaimChallenge"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderClaimChallenge_whatsapp_createdAt_idx" ON "ProviderClaimChallenge"("whatsapp", "createdAt");

-- AddForeignKey
ALTER TABLE "ProviderClaimChallenge" ADD CONSTRAINT "ProviderClaimChallenge_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
