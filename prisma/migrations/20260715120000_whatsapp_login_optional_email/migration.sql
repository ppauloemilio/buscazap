-- Cadastro simples: e-mail opcional, WhatsApp como identificador único

-- 1) Normaliza WhatsApp (só dígitos) e adiciona 55 quando faltar
UPDATE "Provider"
SET "whatsapp" = regexp_replace("whatsapp", '[^0-9]', '', 'g');

UPDATE "Provider"
SET "whatsapp" = '55' || "whatsapp"
WHERE length("whatsapp") IN (10, 11)
  AND "whatsapp" NOT LIKE '55%';

-- 2) Resolve colisões de WhatsApp após normalização (mantém o mais antigo)
WITH ranked AS (
  SELECT
    id,
    "whatsapp",
    ROW_NUMBER() OVER (PARTITION BY "whatsapp" ORDER BY "createdAt" ASC, id ASC) AS rn
  FROM "Provider"
)
UPDATE "Provider" AS p
SET "whatsapp" = left(p."whatsapp", 13) || 'x' || right(p.id, 6)
FROM ranked r
WHERE p.id = r.id
  AND r.rn > 1;

-- 3) E-mail opcional + lowercase
ALTER TABLE "Provider" ALTER COLUMN "email" DROP NOT NULL;

UPDATE "Provider"
SET "email" = lower(trim("email"))
WHERE "email" IS NOT NULL;

-- 4) Índice único do WhatsApp
CREATE UNIQUE INDEX IF NOT EXISTS "Provider_whatsapp_key" ON "Provider"("whatsapp");
