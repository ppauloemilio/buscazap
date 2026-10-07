import { PRICING } from "@/config/pricing";
import { uploadProviderImage } from "@/lib/image-upload";
import { prisma } from "@/lib/prisma";
import { resolveAdvertisementImageUrl } from "@/lib/blob-access";

export async function listProviderCompanyImages(providerId: string) {
  const images = await prisma.providerImage.findMany({
    where: { providerId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, url: true, sortOrder: true },
  });

  return images.map((image) => ({
    id: image.id,
    url: resolveAdvertisementImageUrl(image.url),
    sortOrder: image.sortOrder,
  }));
}

export async function countProviderCompanyImages(
  providerId: string
): Promise<number> {
  return prisma.providerImage.count({ where: { providerId } });
}

export async function addProviderCompanyImages(
  providerId: string,
  files: readonly File[]
): Promise<void> {
  if (files.length === 0) {
    return;
  }

  const currentCount = await countProviderCompanyImages(providerId);
  const maxPhotos = PRICING.PROVIDER_MAX_COMPANY_PHOTOS;
  const availableSlots = maxPhotos - currentCount;

  if (availableSlots <= 0) {
    throw new Error(`Você já enviou o máximo de ${maxPhotos} fotos da empresa`);
  }

  const toSave = files.slice(0, availableSlots);
  const lastImage = await prisma.providerImage.findFirst({
    where: { providerId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const startOrder = lastImage?.sortOrder ?? 0;

  await Promise.all(
    toSave.map(async (file, index) => {
      const url = await uploadProviderImage(
        file,
        providerId,
        `company-${startOrder + index + 1}`
      );

      await prisma.providerImage.create({
        data: {
          providerId,
          url,
          sortOrder: startOrder + index + 1,
        },
      });
    })
  );
}

export async function removeProviderCompanyImage(
  providerId: string,
  imageId: string
): Promise<void> {
  const image = await prisma.providerImage.findFirst({
    where: { id: imageId, providerId },
  });

  if (!image) {
    throw new Error("Foto da empresa não encontrada");
  }

  await prisma.providerImage.delete({ where: { id: imageId } });
}
