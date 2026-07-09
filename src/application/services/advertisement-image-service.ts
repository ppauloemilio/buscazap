import {
  ADVERTISEMENT_IMAGE_KIND,
  ADVERTISEMENT_IMAGE_LIMITS,
} from "@/config/advertisement-images";
import { uploadAdvertisementImage } from "@/lib/image-upload";
import { prisma } from "@/lib/prisma";

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

export async function addAdvertisementGalleryImages(
  advertisementId: string,
  galleryFiles: readonly File[]
): Promise<void> {
  if (galleryFiles.length === 0) {
    return;
  }

  const currentCount = await countGalleryImages(advertisementId);
  const availableSlots =
    ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages - currentCount;

  if (availableSlots <= 0) {
    throw new Error(
      `A galeria já possui o máximo de ${ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages} fotos`
    );
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
