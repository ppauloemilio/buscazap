import { ANALYTICS_EVENT_TYPE } from "@/config/analytics";
import { markDataFetchDynamic } from "@/lib/db";
import { prisma } from "@/lib/prisma";

const TRACKABLE_EVENT_TYPES = new Set<string>([
  ANALYTICS_EVENT_TYPE.PAGE_VIEW,
  ANALYTICS_EVENT_TYPE.AD_VIEW,
  ANALYTICS_EVENT_TYPE.WHATSAPP_CLICK,
]);

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDayKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

export async function recordAnalyticsEvent(input: {
  readonly type: string;
  readonly path?: string;
  readonly advertisementId?: string;
  readonly metadata?: Record<string, string>;
}) {
  if (!TRACKABLE_EVENT_TYPES.has(input.type)) {
    return;
  }

  await prisma.analyticsEvent.create({
    data: {
      type: input.type,
      path: input.path?.slice(0, 500) ?? null,
      advertisementId: input.advertisementId ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

export interface AdminAnalyticsReport {
  readonly days: number;
  readonly since: Date;
  readonly totals: {
    readonly pageViews: number;
    readonly adViews: number;
    readonly whatsappClicks: number;
  };
  readonly daily: readonly {
    readonly date: string;
    readonly pageViews: number;
    readonly adViews: number;
    readonly whatsappClicks: number;
  }[];
  readonly topAdvertisements: readonly {
    readonly advertisementId: string;
    readonly title: string;
    readonly category: string;
    readonly city: string;
    readonly adViews: number;
    readonly whatsappClicks: number;
  }[];
}

export interface ProviderAnalyticsReport {
  readonly days: number;
  readonly since: Date;
  readonly totals: {
    readonly adViews: number;
    readonly whatsappClicks: number;
  };
  readonly daily: readonly {
    readonly date: string;
    readonly adViews: number;
    readonly whatsappClicks: number;
  }[];
  readonly advertisements: readonly {
    readonly advertisementId: string;
    readonly title: string;
    readonly category: string;
    readonly city: string;
    readonly adViews: number;
    readonly whatsappClicks: number;
  }[];
}

export async function getProviderAnalyticsReport(
  providerId: string,
  days: number
): Promise<ProviderAnalyticsReport> {
  markDataFetchDynamic();

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const advertisements = await prisma.advertisement.findMany({
    where: { providerId },
    select: { id: true, title: true, category: true, city: true },
    orderBy: { createdAt: "desc" },
  });

  const emptyDaily = [...Array(days)].map((_, offset) => {
    const day = new Date(since);
    day.setDate(since.getDate() + offset);
    return { date: formatDayKey(day), adViews: 0, whatsappClicks: 0 };
  });

  if (advertisements.length === 0) {
    return {
      days,
      since,
      totals: { adViews: 0, whatsappClicks: 0 },
      daily: emptyDaily,
      advertisements: [],
    };
  }

  const adIds = advertisements.map((ad) => ad.id);

  const [events, adViewsGrouped, whatsappGrouped] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: {
        advertisementId: { in: adIds },
        type: {
          in: [
            ANALYTICS_EVENT_TYPE.AD_VIEW,
            ANALYTICS_EVENT_TYPE.WHATSAPP_CLICK,
          ],
        },
        createdAt: { gte: since },
      },
      select: { type: true, createdAt: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["advertisementId"],
      where: {
        type: ANALYTICS_EVENT_TYPE.AD_VIEW,
        advertisementId: { in: adIds },
        createdAt: { gte: since },
      },
      _count: { id: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["advertisementId"],
      where: {
        type: ANALYTICS_EVENT_TYPE.WHATSAPP_CLICK,
        advertisementId: { in: adIds },
        createdAt: { gte: since },
      },
      _count: { id: true },
    }),
  ]);

  const totals = { adViews: 0, whatsappClicks: 0 };
  const dailyMap = new Map<
    string,
    { adViews: number; whatsappClicks: number }
  >();

  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(since);
    day.setDate(since.getDate() + offset);
    dailyMap.set(formatDayKey(day), { adViews: 0, whatsappClicks: 0 });
  }

  for (const event of events) {
    if (event.type === ANALYTICS_EVENT_TYPE.AD_VIEW) totals.adViews += 1;
    if (event.type === ANALYTICS_EVENT_TYPE.WHATSAPP_CLICK) {
      totals.whatsappClicks += 1;
    }

    const dayKey = formatDayKey(event.createdAt);
    const bucket = dailyMap.get(dayKey);
    if (!bucket) continue;

    if (event.type === ANALYTICS_EVENT_TYPE.AD_VIEW) bucket.adViews += 1;
    if (event.type === ANALYTICS_EVENT_TYPE.WHATSAPP_CLICK) {
      bucket.whatsappClicks += 1;
    }
  }

  const adViewCounts = new Map(
    adViewsGrouped
      .filter((row) => row.advertisementId)
      .map((row) => [row.advertisementId!, row._count.id])
  );
  const whatsappCounts = new Map(
    whatsappGrouped
      .filter((row) => row.advertisementId)
      .map((row) => [row.advertisementId!, row._count.id])
  );

  const adsWithStats = advertisements
    .map((ad) => ({
      advertisementId: ad.id,
      title: ad.title,
      category: ad.category,
      city: ad.city,
      adViews: adViewCounts.get(ad.id) ?? 0,
      whatsappClicks: whatsappCounts.get(ad.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.adViews + b.whatsappClicks - (a.adViews + a.whatsappClicks)
    );

  return {
    days,
    since,
    totals,
    daily: [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts })),
    advertisements: adsWithStats,
  };
}

export async function getAdminAnalyticsReport(
  days: number
): Promise<AdminAnalyticsReport> {
  markDataFetchDynamic();

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [events, adViewsGrouped, whatsappGrouped] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { type: true, createdAt: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["advertisementId"],
      where: {
        type: ANALYTICS_EVENT_TYPE.AD_VIEW,
        advertisementId: { not: null },
        createdAt: { gte: since },
      },
      _count: { id: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["advertisementId"],
      where: {
        type: ANALYTICS_EVENT_TYPE.WHATSAPP_CLICK,
        advertisementId: { not: null },
        createdAt: { gte: since },
      },
      _count: { id: true },
    }),
  ]);

  const totals = {
    pageViews: 0,
    adViews: 0,
    whatsappClicks: 0,
  };

  const dailyMap = new Map<
    string,
    { pageViews: number; adViews: number; whatsappClicks: number }
  >();

  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(since);
    day.setDate(since.getDate() + offset);
    dailyMap.set(formatDayKey(day), {
      pageViews: 0,
      adViews: 0,
      whatsappClicks: 0,
    });
  }

  for (const event of events) {
    if (event.type === ANALYTICS_EVENT_TYPE.PAGE_VIEW) totals.pageViews += 1;
    if (event.type === ANALYTICS_EVENT_TYPE.AD_VIEW) totals.adViews += 1;
    if (event.type === ANALYTICS_EVENT_TYPE.WHATSAPP_CLICK) {
      totals.whatsappClicks += 1;
    }

    const dayKey = formatDayKey(event.createdAt);
    const bucket = dailyMap.get(dayKey);
    if (!bucket) continue;

    if (event.type === ANALYTICS_EVENT_TYPE.PAGE_VIEW) bucket.pageViews += 1;
    if (event.type === ANALYTICS_EVENT_TYPE.AD_VIEW) bucket.adViews += 1;
    if (event.type === ANALYTICS_EVENT_TYPE.WHATSAPP_CLICK) {
      bucket.whatsappClicks += 1;
    }
  }

  const adViewCounts = new Map(
    adViewsGrouped
      .filter((row) => row.advertisementId)
      .map((row) => [row.advertisementId!, row._count.id])
  );
  const whatsappCounts = new Map(
    whatsappGrouped
      .filter((row) => row.advertisementId)
      .map((row) => [row.advertisementId!, row._count.id])
  );

  const advertisementIds = [
    ...new Set([...adViewCounts.keys(), ...whatsappCounts.keys()]),
  ];

  const advertisements =
    advertisementIds.length > 0
      ? await prisma.advertisement.findMany({
          where: { id: { in: advertisementIds } },
          select: { id: true, title: true, category: true, city: true },
        })
      : [];

  const adById = new Map(advertisements.map((ad) => [ad.id, ad]));

  const topAdvertisements = advertisementIds
    .map((id) => {
      const ad = adById.get(id);
      if (!ad) return null;

      return {
        advertisementId: id,
        title: ad.title,
        category: ad.category,
        city: ad.city,
        adViews: adViewCounts.get(id) ?? 0,
        whatsappClicks: whatsappCounts.get(id) ?? 0,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort(
      (a, b) =>
        b.adViews + b.whatsappClicks - (a.adViews + a.whatsappClicks)
    )
    .slice(0, 20);

  return {
    days,
    since,
    totals,
    daily: [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts })),
    topAdvertisements,
  };
}
