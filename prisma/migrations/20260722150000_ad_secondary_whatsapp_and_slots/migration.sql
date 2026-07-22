-- AlterTable Advertisement: optional 2nd WhatsApp contact + labels
ALTER TABLE "Advertisement" ADD COLUMN "whatsappLabel" TEXT;
ALTER TABLE "Advertisement" ADD COLUMN "secondaryWhatsappNumber" TEXT;
ALTER TABLE "Advertisement" ADD COLUMN "secondaryWhatsappLabel" TEXT;

-- AlterTable ProviderLead: optional 2nd WhatsApp contact + labels
ALTER TABLE "ProviderLead" ADD COLUMN "whatsappLabel" TEXT;
ALTER TABLE "ProviderLead" ADD COLUMN "secondaryWhatsapp" TEXT;
ALTER TABLE "ProviderLead" ADD COLUMN "secondaryWhatsappLabel" TEXT;
