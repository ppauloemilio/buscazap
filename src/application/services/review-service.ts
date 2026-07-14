import { prisma } from "@/lib/prisma";
import { AdvertisementStatus } from "@/domain/enums";

export async function createAdvertisementReview(input: {
  readonly advertisementId: string;
  readonly authorName: string;
  readonly rating: number;
  readonly comment?: string;
}) {
  const advertisement = await prisma.advertisement.findUnique({
    where: { id: input.advertisementId },
    select: { id: true, status: true },
  });

  if (!advertisement || advertisement.status === AdvertisementStatus.BLOCKED) {
    throw new Error("ANÚNCIO_NÃO_ENCONTRADO");
  }

  await prisma.review.create({
    data: {
      advertisementId: input.advertisementId,
      authorName: input.authorName,
      rating: input.rating,
      comment: input.comment,
    },
  });

  const aggregates = await prisma.review.aggregate({
    where: { advertisementId: input.advertisementId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.advertisement.update({
    where: { id: input.advertisementId },
    data: {
      rating: Number((aggregates._avg.rating ?? 0).toFixed(1)),
      reviewCount: aggregates._count.rating,
    },
  });
}

export async function listAdvertisementReviews(advertisementId: string) {
  return prisma.review.findMany({
    where: { advertisementId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
