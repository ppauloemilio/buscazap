"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import bcrypt from "bcryptjs";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { PROVIDER_SESSION_COOKIE } from "@/config/pricing";
import {
  createPremiumBoostPayment,
  createSubscriptionPayment,
} from "@/application/services/payment-service";
import { downgradeProviderToBasicTier } from "@/application/services/subscription-service";
import { SubscriptionTier } from "@/domain/enums";
import { prisma } from "@/lib/prisma";
import { canUsePaidAdFeatures } from "@/lib/provider-plan";
import {
  canProviderPublish,
  canProviderUsePaidFeatures,
  getCurrentProvider,
  isAdminProvider,
  isPremiumActive,
  isProviderBlocked,
  requireCurrentProvider,
} from "@/lib/provider-session";
import {
  grantAdminPremiumBoost,
  redeemReferralPremiumBoost,
} from "@/application/services/premium-service";
import {
  applyReferralOnRegistration,
  generateUniqueReferralCode,
} from "@/application/services/referral-service";
import { findProviderByLogin } from "@/application/services/provider-auth-service";
import {
  createAdvertisementSchema,
  loginProviderSchema,
  registerProviderSchema,
  updateAdvertisementSchema,
  updateProviderPasswordSchema,
  updateProviderProfileSchema,
} from "@/schemas/provider-schemas";
import {
  createAdvertisement,
  deleteProviderAdvertisement,
  updateProviderAdvertisement,
} from "@/application/services/advertisement-service";
import { getCatalogLocationError } from "@/application/services/catalog-location";
import {
  addAdvertisementGalleryImages,
  removeAdvertisementGalleryImage,
  removeAdvertisementLogo,
  replaceAdvertisementCover,
  replaceAdvertisementLogo,
  saveAdvertisementImages,
} from "@/application/services/advertisement-image-service";
import {
  addProviderCompanyImages,
  removeProviderCompanyImage,
} from "@/application/services/provider-image-service";
import {
  registerCategorySuggestion,
  resolveAdvertisementCategoryFromCatalog,
} from "@/application/services/category-matching-service";
import { ADVERTISEMENT_IMAGE_LIMITS } from "@/config/advertisement-images";
import { PRICING } from "@/config/pricing";
import {
  parseImageFiles,
  validateImageFile,
} from "@/lib/image-upload";

function redirectToEditImages(
  advertisementId: string,
  query: { error?: string; saved?: string; boosted?: string } = {}
): never {
  const params = new URLSearchParams();
  if (query.error) params.set("error", query.error);
  if (query.saved) params.set("saved", query.saved);
  if (query.boosted) params.set("boosted", query.boosted);

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  redirect(`/painel/anuncios/${advertisementId}/editar${suffix}`);
}

async function requireOwnedPremiumAdvertisement(
  providerId: string,
  advertisementId: string
) {
  const advertisement = await prisma.advertisement.findFirst({
    where: { id: advertisementId, providerId },
    select: { id: true, premiumExpiresAt: true },
  });

  if (!advertisement) {
    redirect("/painel/anuncios");
  }

  // Freemium: plano pago edita fotos (até 4); premium libera extras.
  if (isNewAdProfileEnabled()) {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      select: { role: true, subscriptionExpiresAt: true },
    });
    if (!provider || !canUsePaidAdFeatures(provider)) {
      redirect(`/painel/anuncios/${advertisementId}/editar?error=${encodeURIComponent("Assine para gerenciar fotos do perfil")}`);
    }
    return advertisement;
  }

  if (!isPremiumActive(advertisement.premiumExpiresAt)) {
    redirect("/painel/anuncios");
  }

  return advertisement;
}

function revalidateAdvertisementPaths(advertisementId: string) {
  revalidatePath("/painel/anuncios");
  revalidatePath(`/painel/anuncios/${advertisementId}/editar`);
  revalidatePath(`/anuncio/${advertisementId}`);
  revalidatePath("/buscar");
  revalidatePath("/");
}

function redirectWithPaymentError(returnPath: string, error: unknown): never {
  const message =
    error instanceof Error
      ? error.message
      : "Não foi possível gerar o pagamento PIX";
  redirect(`${returnPath}?error=${encodeURIComponent(message)}`);
}

export async function registerProviderAction(formData: FormData) {
  const parsed = registerProviderSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
    password: formData.get("password"),
    referralCode: formData.get("referralCode"),
  });

  if (!parsed.success) {
    redirect(
      `/cadastro?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  const existingWhatsapp = await prisma.provider.findUnique({
    where: { whatsapp: parsed.data.whatsapp },
  });

  if (existingWhatsapp) {
    redirect(`/cadastro?error=${encodeURIComponent("WhatsApp já cadastrado")}`);
  }

  if (parsed.data.email) {
    const existingEmail = await prisma.provider.findUnique({
      where: { email: parsed.data.email },
    });
    if (existingEmail) {
      redirect(`/cadastro?error=${encodeURIComponent("E-mail já cadastrado")}`);
    }
  }

  if (parsed.data.referralCode) {
    const referrer = await prisma.provider.findUnique({
      where: { referralCode: parsed.data.referralCode },
      select: { id: true },
    });
    if (!referrer) {
      redirect(
        `/cadastro?error=${encodeURIComponent("Código de indicação inválido")}`
      );
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const referralCode = await generateUniqueReferralCode();

  const { referralCode: _ignoredCode, password: _password, ...accountData } =
    parsed.data;

  const provider = await prisma.provider.create({
    data: {
      ...accountData,
      email: accountData.email,
      passwordHash,
      role: "PROVIDER",
      referralCode,
    },
  });

  await applyReferralOnRegistration({
    referredId: provider.id,
    referralCode: parsed.data.referralCode,
  });

  const cookieStore = await cookies();
  cookieStore.set(PROVIDER_SESSION_COOKIE, provider.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  // Freemium: pode ir criar listagem básica; assinatura libera perfil completo.
  redirect(
    isNewAdProfileEnabled() ? "/painel/anuncios/novo" : "/painel/assinatura"
  );
}

export async function redeemReferralPremiumAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const advertisementId = formData.get("advertisementId");

  if (typeof advertisementId !== "string" || !advertisementId) {
    redirect("/painel/anuncios");
  }

  if (!canProviderPublish(provider)) {
    redirect("/painel/assinatura");
  }

  try {
    await redeemReferralPremiumBoost(provider.id, advertisementId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível usar o crédito";
    redirect(`/painel/anuncios?error=${encodeURIComponent(message)}`);
  }

  revalidateAdvertisementPaths(advertisementId);
  revalidatePath("/painel/indicacoes");
  redirectToEditImages(advertisementId, { boosted: "1" });
}

export async function loginProviderAction(formData: FormData) {
  const parsed = loginProviderSchema.safeParse({
    login: formData.get("login") ?? formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(
      `/entrar?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  const provider = await findProviderByLogin(parsed.data.login);

  if (!provider) {
    redirect(`/entrar?error=${encodeURIComponent("Credenciais inválidas")}`);
  }

  const valid = await bcrypt.compare(parsed.data.password, provider.passwordHash);

  if (!valid) {
    redirect(`/entrar?error=${encodeURIComponent("Credenciais inválidas")}`);
  }

  if (isProviderBlocked(provider.status)) {
    redirect(
      `/entrar?error=${encodeURIComponent("Sua conta está bloqueada. Entre em contato com o suporte.")}`
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(PROVIDER_SESSION_COOKIE, provider.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  if (provider.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/painel");
}

export async function logoutProviderAction() {
  const cookieStore = await cookies();
  cookieStore.delete(PROVIDER_SESSION_COOKIE);
  redirect("/");
}

function parseSubscriptionTierFromForm(
  value: FormDataEntryValue | null
): SubscriptionTier {
  if (value === SubscriptionTier.PLUS) {
    return SubscriptionTier.PLUS;
  }
  return SubscriptionTier.BASIC;
}

export async function createSubscriptionPaymentAction(formData?: FormData) {
  const provider = await requireCurrentProvider();

  if (isAdminProvider(provider)) {
    redirect("/painel/assinatura");
  }

  const tier = parseSubscriptionTierFromForm(formData?.get("tier") ?? null);

  let payment;

  try {
    payment = await createSubscriptionPayment(provider.id, { tier });
  } catch (error) {
    redirectWithPaymentError("/painel/assinatura", error);
  }

  redirect(`/pagamento/${payment.id}`);
}

export async function downgradeToBasicPlanAction() {
  const provider = await requireCurrentProvider();

  if (isAdminProvider(provider)) {
    redirect("/painel/assinatura");
  }

  try {
    await downgradeProviderToBasicTier(provider.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível alterar o plano";
    redirect(`/painel/assinatura?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/painel");
  revalidatePath("/painel/assinatura");
  revalidatePath("/painel/promocoes");
  redirect("/painel/assinatura?downgraded=1");
}

export async function createPremiumPaymentAction(advertisementId: string) {
  const provider = await requireCurrentProvider();

  if (!canProviderPublish(provider)) {
    redirect("/painel/assinatura");
  }

  if (isAdminProvider(provider)) {
    await grantAdminPremiumBoost(provider.id, advertisementId);
    revalidateAdvertisementPaths(advertisementId);
    redirectToEditImages(advertisementId, { boosted: "1" });
  }

  let payment;

  try {
    payment = await createPremiumBoostPayment(provider.id, advertisementId);
  } catch (error) {
    redirectWithPaymentError("/painel/anuncios", error);
  }

  redirect(`/pagamento/${payment.id}`);
}

export async function boostAdvertisementAction(formData: FormData) {
  const advertisementId = formData.get("advertisementId");

  if (typeof advertisementId !== "string" || !advertisementId) {
    redirect("/painel/anuncios");
  }

  await createPremiumPaymentAction(advertisementId);
}

export async function createAdvertisementAction(formData: FormData) {
  const provider = await requireCurrentProvider();

  if (!canProviderPublish(provider)) {
    redirect("/painel/assinatura");
  }

  const parsed = createAdvertisementSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    category: formData.get("category"),
    customCategory: formData.get("customCategory"),
    city: formData.get("city"),
    state: formData.get("state"),
    neighborhood: formData.get("neighborhood") || undefined,
    serviceArea: formData.get("serviceArea"),
    whatsappNumber: formData.get("whatsappNumber"),
    whatsappLabel: formData.get("whatsappLabel") || undefined,
    secondaryWhatsappNumber: formData.get("secondaryWhatsappNumber") || undefined,
    secondaryWhatsappLabel: formData.get("secondaryWhatsappLabel") || undefined,
    withPremium: formData.get("withPremium") === "on",
  });

  if (!parsed.success) {
    redirect(
      `/painel/anuncios/novo?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  const locationError = await getCatalogLocationError(
    parsed.data.city,
    parsed.data.state
  );
  if (locationError) {
    redirect(`/painel/anuncios/novo?error=${encodeURIComponent(locationError)}`);
  }

  const coverFile = formData.get("coverImage");
  if (!(coverFile instanceof File)) {
    redirect(
      `/painel/anuncios/novo?error=${encodeURIComponent("A foto de capa é obrigatória")}`
    );
  }

  const coverValidationError = validateImageFile(coverFile, "Foto de capa");
  if (coverValidationError) {
    redirect(
      `/painel/anuncios/novo?error=${encodeURIComponent(coverValidationError)}`
    );
  }

  const advertisementData = {
    title: parsed.data.title,
    description: parsed.data.description,
    type: parsed.data.type,
    city: parsed.data.city,
    state: parsed.data.state,
    neighborhood: parsed.data.neighborhood,
    serviceArea: parsed.data.serviceArea,
    whatsappNumber: parsed.data.whatsappNumber,
    whatsappLabel: parsed.data.whatsappLabel,
    secondaryWhatsappNumber: parsed.data.secondaryWhatsappNumber,
    secondaryWhatsappLabel: parsed.data.secondaryWhatsappLabel,
    withPremium: parsed.data.withPremium,
  };

  const categoryResolution = await resolveAdvertisementCategoryFromCatalog(parsed.data);

  if (categoryResolution.isCustomCategory) {
    await registerCategorySuggestion(categoryResolution.categoryName);
  }

  let result;
  try {
    result = await createAdvertisement({
      providerId: provider.id,
      ...advertisementData,
      category: categoryResolution.categoryName,
      isCustomCategory: categoryResolution.isCustomCategory,
      bypassAdSlotLimit: isAdminProvider(provider),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível criar o anúncio";
    redirect(`/painel/anuncios/novo?error=${encodeURIComponent(message)}`);
  }

  try {
    await saveAdvertisementImages(result.advertisement.id, coverFile, []);
  } catch (error) {
    await deleteProviderAdvertisement(provider.id, result.advertisement.id);

    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível enviar as fotos do anúncio";

    redirect(
      `/painel/anuncios/novo?error=${encodeURIComponent(message)}`
    );
  }

  revalidatePath("/painel/anuncios");
  revalidatePath("/buscar");
  revalidatePath("/");

  if (result.requiresPremiumPayment) {
    if (isAdminProvider(provider)) {
      await grantAdminPremiumBoost(provider.id, result.advertisement.id);
      revalidateAdvertisementPaths(result.advertisement.id);
      redirectToEditImages(result.advertisement.id, { boosted: "1" });
    }

    let payment;

    try {
      payment = await createPremiumBoostPayment(
        provider.id,
        result.advertisement.id
      );
    } catch (error) {
      redirectWithPaymentError("/painel/anuncios", error);
    }

    redirect(`/pagamento/${payment.id}`);
  }

  redirect("/painel/anuncios");
}

export async function updateAdvertisementAction(formData: FormData) {
  const provider = await requireCurrentProvider();

  const advertisementIdRaw = formData.get("advertisementId");
  const advertisementId =
    typeof advertisementIdRaw === "string" ? advertisementIdRaw : "";
  const redirectBase = advertisementId
    ? `/painel/anuncios/${advertisementId}/editar`
    : "/painel/anuncios";

  const owned = await prisma.advertisement.findFirst({
    where: { id: advertisementId, providerId: provider.id },
    select: { id: true },
  });

  if (!owned) {
    redirect("/painel/anuncios");
  }

  const parsed = updateAdvertisementSchema.safeParse({
    advertisementId,
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    category: formData.get("category"),
    customCategory: formData.get("customCategory"),
    city: formData.get("city"),
    state: formData.get("state"),
    neighborhood: formData.get("neighborhood") || undefined,
    serviceArea: formData.get("serviceArea"),
    whatsappNumber: formData.get("whatsappNumber"),
    whatsappLabel: formData.get("whatsappLabel") || undefined,
    secondaryWhatsappNumber: formData.get("secondaryWhatsappNumber") || undefined,
    secondaryWhatsappLabel: formData.get("secondaryWhatsappLabel") || undefined,
  });

  if (!parsed.success) {
    redirect(
      `${redirectBase}?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  const locationError = await getCatalogLocationError(
    parsed.data.city,
    parsed.data.state
  );
  if (locationError) {
    redirect(`${redirectBase}?error=${encodeURIComponent(locationError)}`);
  }

  try {
    await updateProviderAdvertisement({
      providerId: provider.id,
      advertisementId: parsed.data.advertisementId,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      category: parsed.data.category,
      customCategory: parsed.data.customCategory,
      city: parsed.data.city,
      state: parsed.data.state,
      neighborhood: parsed.data.neighborhood,
      serviceArea: parsed.data.serviceArea,
      whatsappNumber: parsed.data.whatsappNumber,
      whatsappLabel: parsed.data.whatsappLabel,
      secondaryWhatsappNumber: parsed.data.secondaryWhatsappNumber,
      secondaryWhatsappLabel: parsed.data.secondaryWhatsappLabel,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível atualizar o anúncio";
    redirect(`${redirectBase}?error=${encodeURIComponent(message)}`);
  }

  revalidateAdvertisementPaths(advertisementId);
  redirect(`${redirectBase}?saved=1`);
}

export async function updateAdvertisementImagesAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const advertisementId = formData.get("advertisementId");

  if (typeof advertisementId !== "string" || !advertisementId) {
    redirect("/painel/anuncios");
  }

  try {
    const advertisement = await requireOwnedPremiumAdvertisement(
      provider.id,
      advertisementId
    );

    const coverFile = formData.get("coverImage");
    const logoFile = formData.get("logoImage");
    const galleryFiles = parseImageFiles(formData, "galleryImages");

    if (galleryFiles.length > ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages) {
      redirectToEditImages(advertisementId, {
        error: `Envie no máximo ${ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages} fotos por vez`,
      });
    }

    for (const galleryFile of galleryFiles) {
      const galleryValidationError = validateImageFile(
        galleryFile,
        "Foto da galeria"
      );
      if (galleryValidationError) {
        redirectToEditImages(advertisementId, { error: galleryValidationError });
      }
    }

    const hasCoverFile = coverFile instanceof File && coverFile.size > 0;
    const hasLogoFile = logoFile instanceof File && logoFile.size > 0;
    const hasGalleryFiles = galleryFiles.length > 0;

    if (!hasCoverFile && !hasLogoFile && !hasGalleryFiles) {
      redirectToEditImages(advertisementId, {
        error: "Selecione ao menos uma foto para atualizar",
      });
    }

    if (hasCoverFile) {
      const coverValidationError = validateImageFile(coverFile, "Foto de capa");
      if (coverValidationError) {
        redirectToEditImages(advertisementId, { error: coverValidationError });
      }
    }

    if (hasLogoFile) {
      const logoValidationError = validateImageFile(logoFile, "Logo da marca");
      if (logoValidationError) {
        redirectToEditImages(advertisementId, { error: logoValidationError });
      }
    }

    const requestFiles = [
      ...(hasCoverFile ? [coverFile as File] : []),
      ...(hasLogoFile ? [logoFile as File] : []),
      ...galleryFiles,
    ];
    const requestBytes = requestFiles.reduce((sum, file) => sum + file.size, 0);
    if (requestBytes > ADVERTISEMENT_IMAGE_LIMITS.maxRequestBytes) {
      redirectToEditImages(advertisementId, {
        error:
          `O conjunto de fotos ultrapassa ${ADVERTISEMENT_IMAGE_LIMITS.maxRequestBytes / (1024 * 1024)} MB. ` +
          "Envie menos fotos por vez ou reduza o tamanho das imagens.",
      });
    }

    if (hasCoverFile) {
      await replaceAdvertisementCover(advertisementId, coverFile);
    }

    if (hasLogoFile) {
      await replaceAdvertisementLogo(advertisementId, logoFile as File);
    }

    if (hasGalleryFiles) {
      if (
        isNewAdProfileEnabled() &&
        !isPremiumActive(advertisement.premiumExpiresAt)
      ) {
        redirectToEditImages(advertisementId, {
          error:
            "As fotos da empresa ficam em Meu perfil. A galeria do anúncio é só com destaque premium.",
        });
      }
      await addAdvertisementGalleryImages(advertisementId, galleryFiles);
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível atualizar as fotos do anúncio";

    redirectToEditImages(advertisementId, { error: message });
  }

  revalidateAdvertisementPaths(advertisementId);
  redirectToEditImages(advertisementId, { saved: "1" });
}

export async function removeAdvertisementGalleryImageAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const advertisementId = formData.get("advertisementId");
  const imageId = formData.get("imageId");

  if (
    typeof advertisementId !== "string" ||
    !advertisementId ||
    typeof imageId !== "string" ||
    !imageId
  ) {
    redirect("/painel/anuncios");
  }

  await requireOwnedPremiumAdvertisement(provider.id, advertisementId);

  try {
    await removeAdvertisementGalleryImage(advertisementId, imageId);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível remover a foto da galeria";

    redirectToEditImages(advertisementId, { error: message });
  }

  revalidateAdvertisementPaths(advertisementId);
  redirectToEditImages(advertisementId, { saved: "1" });
}

export async function removeAdvertisementLogoAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const advertisementId = formData.get("advertisementId");

  if (typeof advertisementId !== "string" || !advertisementId) {
    redirect("/painel/anuncios");
  }

  await requireOwnedPremiumAdvertisement(provider.id, advertisementId);

  try {
    await removeAdvertisementLogo(advertisementId);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível remover o logo";
    redirectToEditImages(advertisementId, { error: message });
  }

  revalidateAdvertisementPaths(advertisementId);
  redirectToEditImages(advertisementId, { saved: "1" });
}

export async function deleteAdvertisementAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const advertisementId = formData.get("advertisementId");

  if (typeof advertisementId !== "string" || !advertisementId) {
    redirect("/painel/anuncios");
  }

  try {
    await deleteProviderAdvertisement(provider.id, advertisementId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível excluir o anúncio";
    redirect(`/painel/anuncios?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/painel/anuncios");
  revalidatePath("/buscar");
  revalidatePath("/");

  redirect("/painel/anuncios?deleted=1");
}

export async function getProviderSessionAction() {
  const provider = await getCurrentProvider();
  if (!provider) return null;

  return {
    id: provider.id,
    name: provider.name,
    email: provider.email,
    hasSubscription: canProviderPublish(provider),
    isAdmin: isAdminProvider(provider),
    subscriptionExpiresAt: provider.subscriptionExpiresAt?.toISOString() ?? null,
  };
}

export async function updateProviderProfileAction(formData: FormData) {
  const provider = await requireCurrentProvider();

  const parsed = updateProviderProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
    age: formData.get("age"),
    state: formData.get("state"),
    city: formData.get("city"),
    neighborhood: formData.get("neighborhood"),
    bio: formData.get("bio"),
  });

  if (!parsed.success) {
    redirect(
      `/painel/perfil?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  if (parsed.data.email && parsed.data.email !== provider.email) {
    const existing = await prisma.provider.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing && existing.id !== provider.id) {
      redirect(
        `/painel/perfil?error=${encodeURIComponent("Este e-mail já está em uso")}`
      );
    }
  }

  if (parsed.data.whatsapp !== provider.whatsapp) {
    const existingWhatsapp = await prisma.provider.findUnique({
      where: { whatsapp: parsed.data.whatsapp },
    });

    if (existingWhatsapp && existingWhatsapp.id !== provider.id) {
      redirect(
        `/painel/perfil?error=${encodeURIComponent("Este WhatsApp já está em uso")}`
      );
    }
  }

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      whatsapp: parsed.data.whatsapp,
      age: parsed.data.age ?? null,
      state: parsed.data.state ?? null,
      city: parsed.data.city ?? null,
      neighborhood: parsed.data.neighborhood ?? null,
      bio: parsed.data.bio ?? null,
    },
  });

  revalidatePath("/painel");
  revalidatePath("/painel/perfil");

  redirect("/painel/perfil?saved=1");
}

function redirectToProfilePhotos(query: {
  error?: string;
  photosSaved?: string;
} = {}): never {
  const params = new URLSearchParams();
  if (query.error) params.set("error", query.error);
  if (query.photosSaved) params.set("photosSaved", query.photosSaved);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  redirect(`/painel/perfil${suffix}`);
}

export async function updateProviderCompanyImagesAction(formData: FormData) {
  const provider = await requireCurrentProvider();

  if (!canProviderUsePaidFeatures(provider)) {
    redirectToProfilePhotos({
      error: "Assine para enviar fotos da empresa",
    });
  }

  const galleryFiles = parseImageFiles(formData, "companyImages");

  if (galleryFiles.length === 0) {
    redirectToProfilePhotos({
      error: "Selecione ao menos uma foto da empresa",
    });
  }

  if (galleryFiles.length > PRICING.PROVIDER_MAX_COMPANY_PHOTOS) {
    redirectToProfilePhotos({
      error: `Envie no máximo ${PRICING.PROVIDER_MAX_COMPANY_PHOTOS} fotos por vez`,
    });
  }

  for (const file of galleryFiles) {
    const validationError = validateImageFile(file, "Foto da empresa");
    if (validationError) {
      redirectToProfilePhotos({ error: validationError });
    }
  }

  const requestBytes = galleryFiles.reduce((sum, file) => sum + file.size, 0);
  if (requestBytes > ADVERTISEMENT_IMAGE_LIMITS.maxRequestBytes) {
    redirectToProfilePhotos({
      error:
        `O conjunto de fotos ultrapassa ${ADVERTISEMENT_IMAGE_LIMITS.maxRequestBytes / (1024 * 1024)} MB. ` +
        "Envie menos fotos por vez ou reduza o tamanho das imagens.",
    });
  }

  try {
    await addProviderCompanyImages(provider.id, galleryFiles);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível salvar as fotos da empresa";
    redirectToProfilePhotos({ error: message });
  }

  revalidatePath("/painel/perfil");
  revalidatePath("/buscar");
  revalidatePath("/");
  redirectToProfilePhotos({ photosSaved: "1" });
}

export async function removeProviderCompanyImageAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const imageId = formData.get("imageId");

  if (typeof imageId !== "string" || !imageId) {
    redirect("/painel/perfil");
  }

  if (!canProviderUsePaidFeatures(provider)) {
    redirectToProfilePhotos({
      error: "Assine para gerenciar fotos da empresa",
    });
  }

  try {
    await removeProviderCompanyImage(provider.id, imageId);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível remover a foto";
    redirectToProfilePhotos({ error: message });
  }

  revalidatePath("/painel/perfil");
  revalidatePath("/buscar");
  revalidatePath("/");
  redirectToProfilePhotos({ photosSaved: "1" });
}

export async function updateProviderPasswordAction(formData: FormData) {
  const provider = await requireCurrentProvider();

  const parsed = updateProviderPasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect(
      `/painel/perfil?passwordError=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Dados inválidos")}`
    );
  }

  const validCurrent = await bcrypt.compare(
    parsed.data.currentPassword,
    provider.passwordHash
  );

  if (!validCurrent) {
    redirect(
      `/painel/perfil?passwordError=${encodeURIComponent("Senha atual incorreta")}`
    );
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    redirect(
      `/painel/perfil?passwordError=${encodeURIComponent("A nova senha deve ser diferente da atual")}`
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);

  await prisma.provider.update({
    where: { id: provider.id },
    data: { passwordHash },
  });

  revalidatePath("/painel/perfil");

  redirect("/painel/perfil?passwordSaved=1");
}

function redirectToAdEdit(
  advertisementId: string,
  params?: { error?: string; saved?: string }
): never {
  const search = new URLSearchParams();
  if (params?.error) search.set("error", params.error);
  if (params?.saved) search.set("saved", params.saved);
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  redirect(`/painel/anuncios/${advertisementId}/editar${suffix}`);
}

export async function updateAdvertisementProfileExtrasAction(
  formData: FormData
) {
  const provider = await requireCurrentProvider();
  if (!canProviderUsePaidFeatures(provider)) {
    redirect("/painel/assinatura");
  }

  const advertisementId = formData.get("advertisementId");
  if (typeof advertisementId !== "string" || !advertisementId) {
    redirect("/painel/anuncios");
  }

  const hours: Record<string, string | null> = {};
  for (let day = 0; day < 7; day += 1) {
    const raw = formData.get(`hours_${day}`);
    const value = typeof raw === "string" ? raw.trim() : "";
    hours[String(day)] = value || null;
  }

  try {
    const { updateAdvertisementProfileExtras } = await import(
      "@/application/services/advertisement-catalog-items-service"
    );
    await updateAdvertisementProfileExtras({
      providerId: provider.id,
      advertisementId,
      streetAddress: String(formData.get("streetAddress") ?? "").trim() || null,
      instagram: String(formData.get("instagram") ?? "").trim() || null,
      website: String(formData.get("website") ?? "").trim() || null,
      businessHoursJson: JSON.stringify(hours),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar o perfil";
    redirectToAdEdit(advertisementId, { error: message });
  }

  revalidateAdvertisementPaths(advertisementId);
  redirectToAdEdit(advertisementId, { saved: "1" });
}

export async function saveAdvertisementProductAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const advertisementId = formData.get("advertisementId");
  if (typeof advertisementId !== "string" || !advertisementId) {
    redirect("/painel/anuncios");
  }

  const title = String(formData.get("title") ?? "").trim();
  const price = Number(formData.get("price"));
  if (!title || Number.isNaN(price) || price < 0) {
    redirectToAdEdit(advertisementId, { error: "Produto inválido" });
  }

  const imageFile = formData.get("image");
  let imageUrl: string | null | undefined;

  try {
    if (imageFile instanceof File && imageFile.size > 0) {
      const validationError = validateImageFile(imageFile, "Imagem do produto");
      if (validationError) {
        redirectToAdEdit(advertisementId, { error: validationError });
      }
      const { uploadAdvertisementImage } = await import("@/lib/image-upload");
      imageUrl = await uploadAdvertisementImage(
        imageFile,
        advertisementId,
        `product-${Date.now()}`
      );
    }

    const { upsertAdvertisementProduct } = await import(
      "@/application/services/advertisement-catalog-items-service"
    );
    await upsertAdvertisementProduct({
      providerId: provider.id,
      advertisementId,
      title,
      price,
      imageUrl,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar o produto";
    redirectToAdEdit(advertisementId, { error: message });
  }

  revalidateAdvertisementPaths(advertisementId);
  redirectToAdEdit(advertisementId, { saved: "1" });
}

export async function deleteAdvertisementProductAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const advertisementId = formData.get("advertisementId");
  const productId = formData.get("productId");
  if (
    typeof advertisementId !== "string" ||
    !advertisementId ||
    typeof productId !== "string" ||
    !productId
  ) {
    redirect("/painel/anuncios");
  }

  try {
    const { deleteAdvertisementProduct } = await import(
      "@/application/services/advertisement-catalog-items-service"
    );
    await deleteAdvertisementProduct({
      providerId: provider.id,
      advertisementId,
      productId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível remover o produto";
    redirectToAdEdit(advertisementId, { error: message });
  }

  revalidateAdvertisementPaths(advertisementId);
  redirectToAdEdit(advertisementId, { saved: "1" });
}

export async function saveAdvertisementServiceAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const advertisementId = formData.get("advertisementId");
  if (typeof advertisementId !== "string" || !advertisementId) {
    redirect("/painel/anuncios");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("priceFrom") ?? "").trim();
  const priceFrom = priceRaw ? Number(priceRaw) : null;
  if (!title || !description) {
    redirectToAdEdit(advertisementId, { error: "Serviço inválido" });
  }

  const imageFile = formData.get("image");
  let imageUrl: string | null | undefined;

  try {
    if (imageFile instanceof File && imageFile.size > 0) {
      const validationError = validateImageFile(imageFile, "Imagem do serviço");
      if (validationError) {
        redirectToAdEdit(advertisementId, { error: validationError });
      }
      const { uploadAdvertisementImage } = await import("@/lib/image-upload");
      imageUrl = await uploadAdvertisementImage(
        imageFile,
        advertisementId,
        `service-${Date.now()}`
      );
    }

    const { upsertAdvertisementService } = await import(
      "@/application/services/advertisement-catalog-items-service"
    );
    await upsertAdvertisementService({
      providerId: provider.id,
      advertisementId,
      title,
      description,
      priceFrom:
        priceFrom !== null && !Number.isNaN(priceFrom) ? priceFrom : null,
      imageUrl,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar o serviço";
    redirectToAdEdit(advertisementId, { error: message });
  }

  revalidateAdvertisementPaths(advertisementId);
  redirectToAdEdit(advertisementId, { saved: "1" });
}

export async function deleteAdvertisementServiceAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const advertisementId = formData.get("advertisementId");
  const serviceId = formData.get("serviceId");
  if (
    typeof advertisementId !== "string" ||
    !advertisementId ||
    typeof serviceId !== "string" ||
    !serviceId
  ) {
    redirect("/painel/anuncios");
  }

  try {
    const { deleteAdvertisementService } = await import(
      "@/application/services/advertisement-catalog-items-service"
    );
    await deleteAdvertisementService({
      providerId: provider.id,
      advertisementId,
      serviceId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível remover o serviço";
    redirectToAdEdit(advertisementId, { error: message });
  }

  revalidateAdvertisementPaths(advertisementId);
  redirectToAdEdit(advertisementId, { saved: "1" });
}

function redirectToPromotions(query?: { error?: string; saved?: string }): never {
  const params = new URLSearchParams();
  if (query?.error) params.set("error", query.error);
  if (query?.saved) params.set("saved", "1");
  const qs = params.toString();
  redirect(qs ? `/painel/promocoes?${qs}` : "/painel/promocoes");
}

export async function saveProviderPromotionAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const promotionId = String(formData.get("promotionId") ?? "").trim() || undefined;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceOriginal = Number(formData.get("priceOriginal"));
  const pricePromo = Number(formData.get("pricePromo"));
  const startsAtRaw = String(formData.get("startsAt") ?? "").trim();
  const endsAtRaw = String(formData.get("endsAt") ?? "").trim();

  if (!startsAtRaw || !endsAtRaw) {
    redirectToPromotions({ error: "Informe datas de início e fim válidas" });
  }

  const startsAtValue = new Date(startsAtRaw);
  const endsAtValue = new Date(endsAtRaw);

  if (
    Number.isNaN(startsAtValue.getTime()) ||
    Number.isNaN(endsAtValue.getTime())
  ) {
    redirectToPromotions({ error: "Informe datas de início e fim válidas" });
  }

  const imageFile = formData.get("image");
  let imageUrl: string | null | undefined;

  try {
    if (imageFile instanceof File && imageFile.size > 0) {
      const validationError = validateImageFile(imageFile, "Imagem da promoção");
      if (validationError) {
        redirectToPromotions({ error: validationError });
      }
      const { uploadAdvertisementImage } = await import("@/lib/image-upload");
      const ad = await prisma.advertisement.findFirst({
        where: { providerId: provider.id },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      });
      const uploadScope = ad?.id ?? provider.id;
      imageUrl = await uploadAdvertisementImage(
        imageFile,
        uploadScope,
        `promo-${Date.now()}`
      );
    }

    const { upsertProviderPromotion } = await import(
      "@/application/services/provider-promotion-service"
    );
    await upsertProviderPromotion({
      providerId: provider.id,
      promotionId,
      title,
      description,
      priceOriginal,
      pricePromo,
      startsAt: startsAtValue,
      endsAt: endsAtValue,
      imageUrl,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar a promoção";
    redirectToPromotions({ error: message });
  }

  revalidatePath("/painel/promocoes");
  revalidatePath("/buscar");
  revalidatePath("/");
  redirectToPromotions({ saved: "1" });
}

export async function deleteProviderPromotionAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const promotionId = String(formData.get("promotionId") ?? "").trim();
  if (!promotionId) redirect("/painel/promocoes");

  try {
    const { deleteProviderPromotion } = await import(
      "@/application/services/provider-promotion-service"
    );
    await deleteProviderPromotion({
      providerId: provider.id,
      promotionId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível excluir";
    redirectToPromotions({ error: message });
  }

  revalidatePath("/painel/promocoes");
  revalidatePath("/buscar");
  redirectToPromotions({ saved: "1" });
}

export async function toggleProviderPromotionAction(formData: FormData) {
  const provider = await requireCurrentProvider();
  const promotionId = String(formData.get("promotionId") ?? "").trim();
  const enabled = formData.get("enabled") === "true";
  if (!promotionId) redirect("/painel/promocoes");

  try {
    const { setProviderPromotionEnabled } = await import(
      "@/application/services/provider-promotion-service"
    );
    await setProviderPromotionEnabled({
      providerId: provider.id,
      promotionId,
      enabled,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível atualizar";
    redirectToPromotions({ error: message });
  }

  revalidatePath("/painel/promocoes");
  revalidatePath("/buscar");
  redirectToPromotions({ saved: "1" });
}
