-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "listingProfile" TEXT NOT NULL DEFAULT 'SIMPLE';

-- Contas que já assinaram ou têm histórico de assinatura → painel completo
UPDATE "Provider"
SET "listingProfile" = 'FULL'
WHERE "subscriptionExpiresAt" IS NOT NULL
   OR "id" IN (SELECT DISTINCT "providerId" FROM "Subscription");
