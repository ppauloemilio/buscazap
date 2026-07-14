-- CreateTable
CREATE TABLE "HomepageSetting" (
    "id" TEXT NOT NULL,
    "showUrgentSearches" BOOLEAN NOT NULL DEFAULT false,
    "showPopularCategories" BOOLEAN NOT NULL DEFAULT false,
    "showCityExplorer" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSetting_pkey" PRIMARY KEY ("id")
);

-- Seed default (all sections disabled)
INSERT INTO "HomepageSetting" ("id", "showUrgentSearches", "showPopularCategories", "showCityExplorer", "updatedAt")
VALUES ('default', false, false, false, CURRENT_TIMESTAMP);
