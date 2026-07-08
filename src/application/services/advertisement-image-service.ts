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

  const galleryToSave = galleryFiles.slice(
    0,
    ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages
  );

  await Promise.all(
    galleryToSave.map(async (file, index) => {
      const url = await uploadAdvertisementImage(
        file,
        advertisementId,
        `gallery-${index + 1}`
      );

      await prisma.advertisementImage.create({
        data: {
          advertisementId,
          url,
          kind: ADVERTISEMENT_IMAGE_KIND.GALLERY,
          sortOrder: index + 1,
        },
      });
    })
  );
}
