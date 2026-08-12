export const ANALYTICS_EVENT_TYPE = {
  PAGE_VIEW: "PAGE_VIEW",
  AD_VIEW: "AD_VIEW",
  WHATSAPP_CLICK: "WHATSAPP_CLICK",
} as const;

export type AnalyticsEventType =
  (typeof ANALYTICS_EVENT_TYPE)[keyof typeof ANALYTICS_EVENT_TYPE];

export const ANALYTICS_REPORT_DAYS_OPTIONS = [7, 30, 90] as const;

export type AnalyticsReportDays =
  (typeof ANALYTICS_REPORT_DAYS_OPTIONS)[number];
