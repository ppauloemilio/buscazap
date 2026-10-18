import {
  createQuickFreeListingAsAdmin,
  type QuickFreeListingResult,
} from "@/application/services/admin-quick-free-listing-service";
import {
  findMatchingCatalogCategory,
} from "@/application/services/category-matching-service";
import { logAdminAction } from "@/application/services/admin-service";
import { prisma } from "@/lib/prisma";
import {
  parseBulkFreeListingCsv,
  type BulkFreeListingCsvRow,
} from "@/lib/bulk-free-listing-csv";
import {
  formatWhatsAppDisplay,
  normalizeWhatsAppIdentity,
  toLocalWhatsAppDigits,
} from "@/lib/whatsapp";
import { buildWhatsAppLink } from "@/shared/utils/format";
import { buildAbsoluteUrl } from "@/lib/site-url";
import { buildQuickFreeListingWelcomeWhatsAppHref } from "@/lib/advertisement-notify-message";
import { ProviderStatus, UserRole } from "@/domain/enums";
import { isNewAdProfileEnabled } from "@/config/feature-flags";

export type BulkFreeListingPreviewRow = {
  readonly line: number;
  readonly nome: string;
  readonly categoria: string;
  readonly categoriaResolvida: string;
  readonly bairro: string;
  readonly whatsappRaw: string;
  readonly whatsappNormalized: string | null;
  readonly whatsappDisplay: string;
  readonly waMeHref: string | null;
  readonly ok: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
};

export type BulkFreeListingCreatedRow = {
  readonly line: number;
  readonly nome: string;
  readonly whatsapp: string;
  readonly advertisementId: string;
  readonly publicHref: string;
  readonly claimUrl: string;
  readonly notifyHref: string;
};

function validateWhatsAppShape(normalized: string): string | null {
  const local = toLocalWhatsAppDigits(normalized);
  if (local.length === 10) {
    return "Número com 10 dígitos (sem o 9). Confira se é celular com nono dígito.";
  }
  if (local.length === 11 && local[2] !== "9") {
    return "Celular brasileiro costuma ter 9 após o DDD. Confira o número.";
  }
  return null;
}

export async function previewBulkFreeListingsFromCsv(
  csvText: string
): Promise<{
  readonly rows: BulkFreeListingPreviewRow[];
  readonly parseError?: string;
  readonly okCount: number;
  readonly errorCount: number;
}> {
  if (!isNewAdProfileEnabled()) {
    return {
      rows: [],
      parseError:
        "Importação em lote exige o perfil novo (NEXT_PUBLIC_NEW_AD_PROFILE).",
      okCount: 0,
      errorCount: 0,
    };
  }

  const parsed = parseBulkFreeListingCsv(csvText);
  if (parsed.parseError) {
    return {
      rows: [],
      parseError: parsed.parseError,
      okCount: 0,
      errorCount: 0,
    };
  }

  return previewBulkFreeListingRows(parsed.rows);
}

export async function previewBulkFreeListingRows(
  inputRows: readonly BulkFreeListingCsvRow[]
): Promise<{
  readonly rows: BulkFreeListingPreviewRow[];
  readonly okCount: number;
  readonly errorCount: number;
}> {
  const catalogCategories = await prisma.catalogCategory.findMany({
    where: { isActive: true },
    select: { name: true, slug: true },
  });

  const normalizedCandidates = inputRows
    .map((row) => normalizeWhatsAppIdentity(row.whatsapp.trim()))
    .filter((value): value is string => Boolean(value));

  const existingProviders =
    normalizedCandidates.length > 0
      ? await prisma.provider.findMany({
          where: { whatsapp: { in: [...new Set(normalizedCandidates)] } },
          select: { whatsapp: true, role: true, status: true, name: true },
        })
      : [];
  const existingByWhatsapp = new Map(
    existingProviders.map((provider) => [provider.whatsapp, provider])
  );

  const seenWhatsapp = new Map<string, number>();
  const rows: BulkFreeListingPreviewRow[] = [];

  for (const row of inputRows) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const nome = row.nome.trim();
    const categoria = row.categoria.trim();
    const bairro = row.bairro.trim();
    const whatsappRaw = row.whatsapp.trim();

    if (!nome) errors.push("Nome/título vazio");
    if (!categoria) errors.push("Categoria vazia");
    if (!bairro) errors.push("Bairro vazio");
    if (!whatsappRaw) errors.push("WhatsApp vazio");

    const whatsappNormalized = whatsappRaw
      ? normalizeWhatsAppIdentity(whatsappRaw)
      : null;

    if (whatsappRaw && !whatsappNormalized) {
      errors.push("WhatsApp inválido (use DDD + número, ex.: 91999999999)");
    }

    if (whatsappNormalized) {
      const shapeWarning = validateWhatsAppShape(whatsappNormalized);
      if (shapeWarning) warnings.push(shapeWarning);

      const firstLine = seenWhatsapp.get(whatsappNormalized);
      if (firstLine !== undefined) {
        errors.push(`WhatsApp repetido na planilha (linha ${firstLine})`);
      } else {
        seenWhatsapp.set(whatsappNormalized, row.line);
      }

      const existing = existingByWhatsapp.get(whatsappNormalized);
      if (existing) {
        if (existing.role === UserRole.ADMIN) {
          errors.push("WhatsApp pertence a um administrador");
        } else if (existing.status === ProviderStatus.BLOCKED) {
          errors.push("Já existe anunciante bloqueado com este WhatsApp");
        } else {
          errors.push(`WhatsApp já cadastrado (${existing.name})`);
        }
      }
    }

    const matched = categoria
      ? findMatchingCatalogCategory(categoria, catalogCategories)
      : null;
    const categoriaResolvida = matched?.name ?? categoria;
    if (categoria && !matched) {
      warnings.push(
        "Categoria não encontrada no catálogo — será usada como texto livre"
      );
    }

    const ok = errors.length === 0;
    const waMeHref = whatsappNormalized
      ? buildWhatsAppLink(whatsappNormalized)
      : null;

    rows.push({
      line: row.line,
      nome,
      categoria,
      categoriaResolvida,
      bairro,
      whatsappRaw,
      whatsappNormalized,
      whatsappDisplay: whatsappNormalized
        ? formatWhatsAppDisplay(whatsappNormalized)
        : whatsappRaw,
      waMeHref,
      ok,
      errors,
      warnings,
    });
  }

  return {
    rows,
    okCount: rows.filter((r) => r.ok).length,
    errorCount: rows.filter((r) => !r.ok).length,
  };
}

export async function createBulkFreeListingsAsAdmin(input: {
  readonly adminId: string;
  readonly rows: readonly {
    readonly line: number;
    readonly nome: string;
    readonly categoria: string;
    readonly bairro: string;
    readonly whatsapp: string;
  }[];
}): Promise<{
  readonly created: BulkFreeListingCreatedRow[];
  readonly failed: readonly { readonly line: number; readonly error: string }[];
}> {
  if (!isNewAdProfileEnabled()) {
    throw new Error(
      "Importação em lote exige o perfil novo (NEXT_PUBLIC_NEW_AD_PROFILE)."
    );
  }

  const created: BulkFreeListingCreatedRow[] = [];
  const failed: { line: number; error: string }[] = [];

  for (const row of input.rows) {
    try {
      const result: QuickFreeListingResult = await createQuickFreeListingAsAdmin({
        adminId: input.adminId,
        title: row.nome,
        category: row.categoria,
        neighborhood: row.bairro,
        whatsapp: row.whatsapp,
      });

      const notifyHref = buildQuickFreeListingWelcomeWhatsAppHref({
        whatsapp: result.whatsapp,
        adUrl: buildAbsoluteUrl(result.publicHref),
        claimUrl: result.claimUrl,
      });

      created.push({
        line: row.line,
        nome: result.adTitle,
        whatsapp: result.whatsapp,
        advertisementId: result.advertisementId,
        publicHref: result.publicHref,
        claimUrl: result.claimUrl,
        notifyHref,
      });
    } catch (error) {
      failed.push({
        line: row.line,
        error:
          error instanceof Error ? error.message : "Falha ao criar anúncio",
      });
    }
  }

  await logAdminAction({
    adminId: input.adminId,
    action: "BULK_CREATE_QUICK_FREE_LISTINGS",
    entityType: "Advertisement",
    entityId: input.adminId,
    metadata: {
      requested: input.rows.length,
      created: created.length,
      failed: failed.length,
      advertisementIds: created.map((c) => c.advertisementId),
    },
  });

  return { created, failed };
}
