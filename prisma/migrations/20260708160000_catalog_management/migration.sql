-- CreateTable
CREATE TABLE "CatalogCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Tag',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogState" (
    "id" TEXT NOT NULL,
    "uf" VARCHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogCity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogCity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogCategory_name_key" ON "CatalogCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogCategory_slug_key" ON "CatalogCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogState_uf_key" ON "CatalogState"("uf");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogState_name_key" ON "CatalogState"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogCity_name_stateId_key" ON "CatalogCity"("name", "stateId");

-- AddForeignKey
ALTER TABLE "CatalogCity" ADD CONSTRAINT "CatalogCity_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "CatalogState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed categories
INSERT INTO "CatalogCategory" (id, name, slug, icon, "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
('cat_saude', 'Saúde', 'saude', 'Heart', true, 1, NOW(), NOW()),
('cat_beleza', 'Beleza', 'beleza', 'Sparkles', true, 2, NOW(), NOW()),
('cat_construcao', 'Construção', 'construcao', 'Hammer', true, 3, NOW(), NOW()),
('cat_alimentacao', 'Alimentação', 'alimentacao', 'UtensilsCrossed', true, 4, NOW(), NOW()),
('cat_tecnologia', 'Tecnologia', 'tecnologia', 'Laptop', true, 5, NOW(), NOW()),
('cat_educacao', 'Educação', 'educacao', 'GraduationCap', true, 6, NOW(), NOW()),
('cat_automotivo', 'Automotivo', 'automotivo', 'Car', true, 7, NOW(), NOW()),
('cat_moda', 'Moda', 'moda', 'Shirt', true, 8, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Seed states
INSERT INTO "CatalogState" (id, uf, name, "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
('st_ac', 'AC', 'Acre', true, 1, NOW(), NOW()),
('st_al', 'AL', 'Alagoas', true, 2, NOW(), NOW()),
('st_ap', 'AP', 'Amapá', true, 3, NOW(), NOW()),
('st_am', 'AM', 'Amazonas', true, 4, NOW(), NOW()),
('st_ba', 'BA', 'Bahia', true, 5, NOW(), NOW()),
('st_ce', 'CE', 'Ceará', true, 6, NOW(), NOW()),
('st_df', 'DF', 'Distrito Federal', true, 7, NOW(), NOW()),
('st_es', 'ES', 'Espírito Santo', true, 8, NOW(), NOW()),
('st_go', 'GO', 'Goiás', true, 9, NOW(), NOW()),
('st_ma', 'MA', 'Maranhão', true, 10, NOW(), NOW()),
('st_mt', 'MT', 'Mato Grosso', true, 11, NOW(), NOW()),
('st_ms', 'MS', 'Mato Grosso do Sul', true, 12, NOW(), NOW()),
('st_mg', 'MG', 'Minas Gerais', true, 13, NOW(), NOW()),
('st_pa', 'PA', 'Pará', true, 14, NOW(), NOW()),
('st_pb', 'PB', 'Paraíba', true, 15, NOW(), NOW()),
('st_pr', 'PR', 'Paraná', true, 16, NOW(), NOW()),
('st_pe', 'PE', 'Pernambuco', true, 17, NOW(), NOW()),
('st_pi', 'PI', 'Piauí', true, 18, NOW(), NOW()),
('st_rj', 'RJ', 'Rio de Janeiro', true, 19, NOW(), NOW()),
('st_rn', 'RN', 'Rio Grande do Norte', true, 20, NOW(), NOW()),
('st_rs', 'RS', 'Rio Grande do Sul', true, 21, NOW(), NOW()),
('st_ro', 'RO', 'Rondônia', true, 22, NOW(), NOW()),
('st_rr', 'RR', 'Roraima', true, 23, NOW(), NOW()),
('st_sc', 'SC', 'Santa Catarina', true, 24, NOW(), NOW()),
('st_sp', 'SP', 'São Paulo', true, 25, NOW(), NOW()),
('st_se', 'SE', 'Sergipe', true, 26, NOW(), NOW()),
('st_to', 'TO', 'Tocantins', true, 27, NOW(), NOW())
ON CONFLICT (uf) DO NOTHING;

-- Seed cities
INSERT INTO "CatalogCity" (id, name, "stateId", "isActive", "createdAt", "updatedAt")
SELECT 'city_sao-paulo-sp', 'São Paulo', id, true, NOW(), NOW() FROM "CatalogState" WHERE uf = 'SP'
ON CONFLICT ("name", "stateId") DO NOTHING;

INSERT INTO "CatalogCity" (id, name, "stateId", "isActive", "createdAt", "updatedAt")
SELECT 'city_rio-de-janeiro-rj', 'Rio de Janeiro', id, true, NOW(), NOW() FROM "CatalogState" WHERE uf = 'RJ'
ON CONFLICT ("name", "stateId") DO NOTHING;

INSERT INTO "CatalogCity" (id, name, "stateId", "isActive", "createdAt", "updatedAt")
SELECT 'city_belo-horizonte-mg', 'Belo Horizonte', id, true, NOW(), NOW() FROM "CatalogState" WHERE uf = 'MG'
ON CONFLICT ("name", "stateId") DO NOTHING;

INSERT INTO "CatalogCity" (id, name, "stateId", "isActive", "createdAt", "updatedAt")
SELECT 'city_brasilia-df', 'Brasília', id, true, NOW(), NOW() FROM "CatalogState" WHERE uf = 'DF'
ON CONFLICT ("name", "stateId") DO NOTHING;

INSERT INTO "CatalogCity" (id, name, "stateId", "isActive", "createdAt", "updatedAt")
SELECT 'city_curitiba-pr', 'Curitiba', id, true, NOW(), NOW() FROM "CatalogState" WHERE uf = 'PR'
ON CONFLICT ("name", "stateId") DO NOTHING;

INSERT INTO "CatalogCity" (id, name, "stateId", "isActive", "createdAt", "updatedAt")
SELECT 'city_salvador-ba', 'Salvador', id, true, NOW(), NOW() FROM "CatalogState" WHERE uf = 'BA'
ON CONFLICT ("name", "stateId") DO NOTHING;

INSERT INTO "CatalogCity" (id, name, "stateId", "isActive", "createdAt", "updatedAt")
SELECT 'city_fortaleza-ce', 'Fortaleza', id, true, NOW(), NOW() FROM "CatalogState" WHERE uf = 'CE'
ON CONFLICT ("name", "stateId") DO NOTHING;

INSERT INTO "CatalogCity" (id, name, "stateId", "isActive", "createdAt", "updatedAt")
SELECT 'city_recife-pe', 'Recife', id, true, NOW(), NOW() FROM "CatalogState" WHERE uf = 'PE'
ON CONFLICT ("name", "stateId") DO NOTHING;

INSERT INTO "CatalogCity" (id, name, "stateId", "isActive", "createdAt", "updatedAt")
SELECT 'city_belem-pa', 'Belém', id, true, NOW(), NOW() FROM "CatalogState" WHERE uf = 'PA'
ON CONFLICT ("name", "stateId") DO NOTHING;
