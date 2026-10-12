import { canManagePaidAdvertisementContent } from "@/lib/provider-plan";
import {
  getMaxProductsForTier,
  getMaxServicesForTier,
} from "@/lib/subscription-limits";
import { getProviderSubscriptionTier } from "@/lib/plus-plan";
import { prisma } from "@/lib/prisma";
import { resolveAdvertisementImageUrl } from "@/lib/blob-access";

async function requirePaidOwnedAdvertisement(
  providerId: string,
  advertisementId: string
) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: {
      id: true,
      role: true,
      subscriptionExpiresAt: true,
      subscriptionTier: true,
      listingProfile: true,
      status: true,
    },
  });

  if (!provider || provider.status === "BLOCKED") {
    throw new Error("Conta bloqueada ou inválida");
  }

  if (!canManagePaidAdvertisementContent(provider)) {
    throw new Error("Assinatura necessária para editar o perfil completo");
  }

  const advertisement = await prisma.advertisement.findFirst({
    where: { id: advertisementId, providerId },
    select: { id: true },
  });

  if (!advertisement) {
    throw new Error("Anúncio não encontrado");
  }

  return { advertisement, provider };
}

export async function listAdvertisementProductsForEdit(
  providerId: string,
  advertisementId: string
) {
  await requirePaidOwnedAdvertisement(providerId, advertisementId);

  const products = await prisma.advertisementProduct.findMany({
    where: { advertisementId },
    orderBy: { sortOrder: "asc" },
  });

  return products.map((product) => ({
    ...product,
    imageUrl: product.imageUrl
      ? resolveAdvertisementImageUrl(product.imageUrl)
      : null,
  }));
}

export async function listAdvertisementServicesForEdit(
  providerId: string,
  advertisementId: string
) {
  await requirePaidOwnedAdvertisement(providerId, advertisementId);

  const services = await prisma.advertisementService.findMany({
    where: { advertisementId },
    orderBy: { sortOrder: "asc" },
  });

  return services.map((service) => ({
    ...service,
    imageUrl: service.imageUrl
      ? resolveAdvertisementImageUrl(service.imageUrl)
      : null,
  }));
}

export async function upsertAdvertisementProduct(input: {
  readonly providerId: string;
  readonly advertisementId: string;
  readonly productId?: string;
  readonly title: string;
  readonly price: number;
  readonly imageUrl?: string | null;
}) {
  const { provider } = await requirePaidOwnedAdvertisement(
    input.providerId,
    input.advertisementId
  );
  const maxProducts = getMaxProductsForTier(
    getProviderSubscriptionTier(provider)
  );

  if (input.productId) {
    const existing = await prisma.advertisementProduct.findFirst({
      where: {
        id: input.productId,
        advertisementId: input.advertisementId,
      },
    });
    if (!existing) throw new Error("Produto não encontrado");

    return prisma.advertisementProduct.update({
      where: { id: input.productId },
      data: {
        title: input.title,
        price: input.price,
        imageUrl: input.imageUrl ?? existing.imageUrl,
      },
    });
  }

  const count = await prisma.advertisementProduct.count({
    where: { advertisementId: input.advertisementId },
  });
  if (count >= maxProducts) {
    throw new Error(`Limite de ${maxProducts} produtos atingido`);
  }

  return prisma.advertisementProduct.create({
    data: {
      advertisementId: input.advertisementId,
      title: input.title,
      price: input.price,
      imageUrl: input.imageUrl ?? null,
      sortOrder: count,
    },
  });
}

export async function deleteAdvertisementProduct(input: {
  readonly providerId: string;
  readonly advertisementId: string;
  readonly productId: string;
}) {
  await requirePaidOwnedAdvertisement(input.providerId, input.advertisementId);

  const existing = await prisma.advertisementProduct.findFirst({
    where: {
      id: input.productId,
      advertisementId: input.advertisementId,
    },
  });
  if (!existing) throw new Error("Produto não encontrado");

  await prisma.advertisementProduct.delete({ where: { id: input.productId } });
}

export async function upsertAdvertisementService(input: {
  readonly providerId: string;
  readonly advertisementId: string;
  readonly serviceId?: string;
  readonly title: string;
  readonly description: string;
  readonly priceFrom?: number | null;
  readonly imageUrl?: string | null;
}) {
  const { provider } = await requirePaidOwnedAdvertisement(
    input.providerId,
    input.advertisementId
  );
  const maxServices = getMaxServicesForTier(
    getProviderSubscriptionTier(provider)
  );

  if (input.serviceId) {
    const existing = await prisma.advertisementService.findFirst({
      where: {
        id: input.serviceId,
        advertisementId: input.advertisementId,
      },
    });
    if (!existing) throw new Error("Serviço não encontrado");

    return prisma.advertisementService.update({
      where: { id: input.serviceId },
      data: {
        title: input.title,
        description: input.description,
        priceFrom: input.priceFrom ?? null,
        imageUrl: input.imageUrl ?? existing.imageUrl,
      },
    });
  }

  const count = await prisma.advertisementService.count({
    where: { advertisementId: input.advertisementId },
  });
  if (count >= maxServices) {
    throw new Error(`Limite de ${maxServices} serviços atingido`);
  }

  return prisma.advertisementService.create({
    data: {
      advertisementId: input.advertisementId,
      title: input.title,
      description: input.description,
      priceFrom: input.priceFrom ?? null,
      imageUrl: input.imageUrl ?? null,
      sortOrder: count,
    },
  });
}

export async function deleteAdvertisementService(input: {
  readonly providerId: string;
  readonly advertisementId: string;
  readonly serviceId: string;
}) {
  await requirePaidOwnedAdvertisement(input.providerId, input.advertisementId);

  const existing = await prisma.advertisementService.findFirst({
    where: {
      id: input.serviceId,
      advertisementId: input.advertisementId,
    },
  });
  if (!existing) throw new Error("Serviço não encontrado");

  await prisma.advertisementService.delete({ where: { id: input.serviceId } });
}

export async function updateAdvertisementProfileExtras(input: {
  readonly providerId: string;
  readonly advertisementId: string;
  readonly streetAddress?: string | null;
  readonly instagram?: string | null;
  readonly website?: string | null;
  readonly businessHoursJson?: string | null;
  readonly description?: string;
}) {
  await requirePaidOwnedAdvertisement(input.providerId, input.advertisementId);

  return prisma.advertisement.update({
    where: { id: input.advertisementId },
    data: {
      streetAddress: input.streetAddress ?? null,
      instagram: input.instagram ?? null,
      website: input.website ?? null,
      businessHoursJson: input.businessHoursJson ?? null,
      ...(typeof input.description === "string"
        ? { description: input.description }
        : {}),
    },
  });
}
