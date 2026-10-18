import bcrypt from "bcryptjs";
import { createAdvertisement } from "@/application/services/advertisement-service";
import { logAdminAction } from "@/application/services/admin-service";
import { generateUniqueReferralCode } from "@/application/services/referral-service";
import { listActiveCities, listActiveStates } from "@/application/services/catalog-service";
import {
  registerCategorySuggestion,
  resolveAdvertisementCategoryFromCatalog,
} from "@/application/services/category-matching-service";
import { FREE_LISTING_DEFAULTS } from "@/lib/free-listing";
import { generateTemporaryPassword } from "@/lib/temporary-password";
import { normalizeWhatsAppIdentity } from "@/lib/whatsapp";
import { prisma } from "@/lib/prisma";
import { getDefaultCatalogLocation } from "@/shared/utils/catalog-location";
import { ProviderStatus, UserRole } from "@/domain/enums";
import { isNewAdProfileEnabled } from "@/config/feature-flags";

export type QuickFreeListingResult = {
  readonly providerId: string;
  readonly providerName: string;
  readonly whatsapp: string;
  readonly advertisementId: string;
  readonly adTitle: string;
  readonly publicHref: string;
  readonly claimUrl: string;
  readonly temporaryPassword: string;
};

export async function createQuickFreeListingAsAdmin(input: {
  readonly adminId: string;
  readonly title: string;
  readonly category: string;
  readonly customCategory?: string;
  readonly neighborhood: string;
  readonly whatsapp: string;
}): Promise<QuickFreeListingResult> {
  if (!isNewAdProfileEnabled()) {
    throw new Error(
      "Cadastro rápido de Plano Grátis exige o perfil novo (NEXT_PUBLIC_NEW_AD_PROFILE)."
    );
  }

  const title = input.title.trim();
  const neighborhood = input.neighborhood.trim();
  if (!title) {
    throw new Error("Informe o título do anúncio");
  }
  if (!neighborhood) {
    throw new Error("Informe o bairro");
  }

  const whatsapp =
    normalizeWhatsAppIdentity(input.whatsapp) ??
    input.whatsapp.replace(/\D/g, "");
  if (!whatsapp || whatsapp.length < 10) {
    throw new Error("WhatsApp inválido");
  }

  const existing = await prisma.provider.findUnique({
    where: { whatsapp },
    select: { id: true, role: true, status: true },
  });
  if (existing) {
    if (existing.role === UserRole.ADMIN) {
      throw new Error("Este WhatsApp pertence a um administrador");
    }
    if (existing.status === ProviderStatus.BLOCKED) {
      throw new Error("Já existe um anunciante bloqueado com este WhatsApp");
    }
    throw new Error(
      "WhatsApp já cadastrado. Use Usuários/Anúncios para editar ou criar outro anúncio."
    );
  }

  const [cities, states] = await Promise.all([
    listActiveCities(),
    listActiveStates(),
  ]);
  const location = getDefaultCatalogLocation(
    cities.map((c) => ({ name: c.name, state: c.state.uf })),
    states.map((s) => ({ uf: s.uf }))
  );
  if (!location.city || !location.state) {
    throw new Error("Catálogo de cidades não configurado");
  }

  const categoryResolution = await resolveAdvertisementCategoryFromCatalog({
    category: input.category,
    customCategory: input.customCategory,
  });
  if (categoryResolution.isCustomCategory) {
    await registerCategorySuggestion(categoryResolution.categoryName);
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const referralCode = await generateUniqueReferralCode();
  const providerName = title.slice(0, 80);

  const provider = await prisma.provider.create({
    data: {
      name: providerName,
      whatsapp,
      passwordHash,
      role: UserRole.PROVIDER,
      status: ProviderStatus.ACTIVE,
      city: location.city,
      state: location.state,
      neighborhood,
      referralCode,
      listingProfile: "SIMPLE",
    },
  });

  const { advertisement } = await createAdvertisement({
    providerId: provider.id,
    title,
    description: FREE_LISTING_DEFAULTS.description,
    type: FREE_LISTING_DEFAULTS.type,
    category: categoryResolution.categoryName,
    isCustomCategory: categoryResolution.isCustomCategory,
    city: location.city,
    state: location.state,
    neighborhood,
    serviceArea: FREE_LISTING_DEFAULTS.serviceArea,
    whatsappNumber: whatsapp,
    bypassAdSlotLimit: true,
  });

  const { issueProviderClaimToken } = await import(
    "@/application/services/provider-claim-service"
  );
  const { claimUrl } = await issueProviderClaimToken(provider.id);

  await logAdminAction({
    adminId: input.adminId,
    action: "CREATE_QUICK_FREE_LISTING",
    entityType: "Advertisement",
    entityId: advertisement.id,
    metadata: {
      providerId: provider.id,
      title,
      category: categoryResolution.categoryName,
      neighborhood,
      city: location.city,
      whatsapp,
    },
  });

  return {
    providerId: provider.id,
    providerName: provider.name,
    whatsapp,
    advertisementId: advertisement.id,
    adTitle: advertisement.title,
    publicHref: advertisement.publicHref ?? `/anuncio/${advertisement.id}`,
    claimUrl,
    temporaryPassword,
  };
}
