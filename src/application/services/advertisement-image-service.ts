import {
  ADVERTISEMENT_IMAGE_KIND,
  ADVERTISEMENT_IMAGE_LIMITS,
  getMaxAdGalleryImages,
} from "@/config/advertisement-images";
import { isNewAdProfileEnabled } from "@/config/feature-flags";
import { uploadAdvertisementImage } from "@/lib/image-upload";
import { prisma } from "@/lib/prisma";
import { isPremiumActive } from "@/lib/provider-session";

export async function saveAdvertisementImages(
  advertisementId: string,
  coverFile: File,
  galleryFiles: readonly File[]
): Promise<void> {
  const coverUrl = await uploadAdvertisementImage(
    coverFile,
    advertisementId,
    "cover"
  );

  await prisma.advertisementImage.create({
    data: {
      advertisementId,
      url: coverUrl,
      kind: ADVERTISEMENT_IMAGE_KIND.COVER,
      sortOrder: 0,
    },
  });

  await addAdvertisementGalleryImages(advertisementId, galleryFiles);
}

export async function countGalleryImages(advertisementId: string): Promise<number> {
  return prisma.advertisementImage.count({
    where: {
      advertisementId,
      kind: ADVERTISEMENT_IMAGE_KIND.GALLERY,
    },
  });
}

export async function replaceAdvertisementCover(
  advertisementId: string,
  coverFile: File
): Promise<void> {
  const coverUrl = await uploadAdvertisementImage(
    coverFile,
    advertisementId,
    "cover"
  );

  await prisma.advertisementImage.deleteMany({
    where: {
      advertisementId,
      kind: ADVERTISEMENT_IMAGE_KIND.COVER,
    },
  });

  await prisma.advertisementImage.create({
    data: {
      advertisementId,
      url: coverUrl,
      kind: ADVERTISEMENT_IMAGE_KIND.COVER,
      sortOrder: 0,
    },
  });
}

export async function replaceAdvertisementLogo(
  advertisementId: string,
  logoFile: File
): Promise<void> {
  const logoUrl = await uploadAdvertisementImage(
    logoFile,
    advertisementId,
    "logo"
  );

  await prisma.advertisementImage.deleteMany({
    where: {
      advertisementId,
      kind: ADVERTISEMENT_IMAGE_KIND.LOGO,
    },
  });

  await prisma.advertisementImage.create({
    data: {
      advertisementId,
      url: logoUrl,
      kind: ADVERTISEMENT_IMAGE_KIND.LOGO,
      sortOrder: 0,
    },
  });
}

export async function removeAdvertisementLogo(
  advertisementId: string
): Promise<void> {
  await prisma.advertisementImage.deleteMany({
    where: {
      advertisementId,
      kind: ADVERTISEMENT_IMAGE_KIND.LOGO,
    },
  });
}

async function resolveGalleryMax(advertisementId: string): Promise<number> {
  if (!isNewAdProfileEnabled()) {
    return ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages;
  }

  const ad = await prisma.advertisement.findUnique({
    where: { id: advertisementId },
    select: { premiumExpiresAt: true },
  });

  const premiumActive = isPremiumActive(ad?.premiumExpiresAt ?? null);
  // Freemium: fotos da empresa ficam no perfil; no anúncio só premium (5).
  return getMaxAdGalleryImages({ premiumActive });
}

export async function addAdvertisementGalleryImages(
  advertisementId: string,
  galleryFiles: readonly File[]
): Promise<void> {
  if (galleryFiles.length === 0) {
    return;
  }

  const currentCount = await countGalleryImages(advertisementId);
  const maxGallery = await resolveGalleryMax(advertisementId);
  const availableSlots = maxGallery - currentCount;

  if (availableSlots <= 0) {
    throw new Error(`A galeria já possui o máximo de ${maxGallery} fotos`);
  }

  const galleryToSave = galleryFiles.slice(0, availableSlots);
  const lastImage = await prisma.advertisementImage.findFirst({
    where: {
      advertisementId,
      kind: ADVERTISEMENT_IMAGE_KIND.GALLERY,
    },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const startOrder = lastImage?.sortOrder ?? 0;

  await Promise.all(
    galleryToSave.map(async (file, index) => {
      const url = await uploadAdvertisementImage(
        file,
        advertisementId,
        `gallery-${startOrder + index + 1}`
      );

      await prisma.advertisementImage.create({
        data: {
          advertisementId,
          url,
          kind: ADVERTISEMENT_IMAGE_KIND.GALLERY,
          sortOrder: startOrder + index + 1,
        },
      });
    })
  );
}

export async function removeAdvertisementGalleryImage(
  advertisementId: string,
  imageId: string
): Promise<void> {
  const image = await prisma.advertisementImage.findFirst({
    where: {
      id: imageId,
      advertisementId,
      kind: ADVERTISEMENT_IMAGE_KIND.GALLERY,
    },
  });

  if (!image) {
    throw new Error("Foto da galeria não encontrada");
  }

  await prisma.advertisementImage.delete({
    where: { id: imageId },
  });
}
