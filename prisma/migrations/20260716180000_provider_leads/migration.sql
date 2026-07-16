-- CreateTable
CREATE TABLE "ProviderLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PA',
    "neighborhood" TEXT NOT NULL,
    "serviceArea" TEXT NOT NULL,
    "adTitle" TEXT NOT NULL,
    "photoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderLead_status_createdAt_idx" ON "ProviderLead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProviderLead_whatsapp_createdAt_idx" ON "ProviderLead"("whatsapp", "createdAt");
