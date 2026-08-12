"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ANALYTICS_EVENT_TYPE } from "@/config/analytics";

function shouldTrackPath(pathname: string): boolean {
  return (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/painel") &&
    !pathname.startsWith("/_next")
  );
}

async function sendAnalyticsEvent(input: {
  readonly type: string;
  readonly path?: string;
  readonly advertisementId?: string;
  readonly metadata?: Record<string, string>;
}) {
  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      keepalive: true,
    });
  } catch {
    // Analytics must not break UX.
  }
}

export function TrackPageView() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || !shouldTrackPath(pathname)) {
      return;
    }

    const key = pathname;
    if (lastTracked.current === key) {
      return;
    }

    lastTracked.current = key;
    void sendAnalyticsEvent({
      type: ANALYTICS_EVENT_TYPE.PAGE_VIEW,
      path: pathname,
    });
  }, [pathname]);

  return null;
}

interface TrackAdViewProps {
  readonly advertisementId: string;
}

export function TrackAdView({ advertisementId }: TrackAdViewProps) {
  const pathname = usePathname();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    void sendAnalyticsEvent({
      type: ANALYTICS_EVENT_TYPE.AD_VIEW,
      path: pathname ?? undefined,
      advertisementId,
    });
  }, [advertisementId, pathname]);

  return null;
}

interface TrackedWhatsAppLinkProps {
  readonly href: string;
  readonly advertisementId: string;
  readonly className?: string;
  readonly children: React.ReactNode;
  readonly "aria-label"?: string;
}

export function TrackedWhatsAppLink({
  href,
  advertisementId,
  className,
  children,
  "aria-label": ariaLabel,
}: TrackedWhatsAppLinkProps) {
  const pathname = usePathname();

  function handleClick() {
    void sendAnalyticsEvent({
      type: ANALYTICS_EVENT_TYPE.WHATSAPP_CLICK,
      path: pathname ?? undefined,
      advertisementId,
    });
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
