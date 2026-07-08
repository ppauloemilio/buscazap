-- AlterTable
ALTER TABLE "Advertisement" ADD COLUMN "isCustomCategory" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CategorySuggestion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "mergedIntoName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategorySuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategorySuggestion_normalizedKey_key" ON "CategorySuggestion"("normalizedKey");

-- Mark existing ads whose category is not in the official catalog
UPDATE "Advertisement" a
SET "isCustomCategory" = true
WHERE NOT EXISTS (
  SELECT 1 FROM "CatalogCategory" c WHERE c.name = a.category
);
