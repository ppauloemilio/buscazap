-- AlterTable
ALTER TABLE "HomepageSetting" ADD COLUMN "showPromotions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "HomepageSetting" ADD COLUMN "sectionOrderJson" TEXT NOT NULL DEFAULT '["popularCategories","urgentSearches","promotions","advertisements","cityExplorer"]';
