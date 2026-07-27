-- AlterTable: SEO-friendly advertisement slug
ALTER TABLE "Advertisement" ADD COLUMN IF NOT EXISTS "slug" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Advertisement_slug_key" ON "Advertisement"("slug");
