-- CreateIndex
CREATE INDEX "Advertisement_status_category_idx" ON "Advertisement"("status", "category");

-- CreateIndex
CREATE INDEX "Advertisement_status_city_idx" ON "Advertisement"("status", "city");

-- CreateIndex
CREATE INDEX "Advertisement_status_createdAt_idx" ON "Advertisement"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Advertisement_providerId_idx" ON "Advertisement"("providerId");
