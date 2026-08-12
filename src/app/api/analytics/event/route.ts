import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/application/services/analytics-service";
import { ANALYTICS_EVENT_TYPE } from "@/config/analytics";

const ALLOWED_TYPES = new Set<string>([
  ANALYTICS_EVENT_TYPE.PAGE_VIEW,
  ANALYTICS_EVENT_TYPE.AD_VIEW,
  ANALYTICS_EVENT_TYPE.WHATSAPP_CLICK,
]);

function isSkippablePath(path: string): boolean {
  return (
    path.startsWith("/admin") ||
    path.startsWith("/api") ||
    path.startsWith("/painel") ||
    path.startsWith("/_next")
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const input = body as {
    type?: unknown;
    path?: unknown;
    advertisementId?: unknown;
    metadata?: unknown;
  };

  if (typeof input.type !== "string" || !ALLOWED_TYPES.has(input.type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const path =
    typeof input.path === "string" && input.path.trim()
      ? input.path.trim()
      : undefined;

  if (path && isSkippablePath(path)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const advertisementId =
    typeof input.advertisementId === "string" && input.advertisementId.trim()
      ? input.advertisementId.trim()
      : undefined;

  if (
    (input.type === ANALYTICS_EVENT_TYPE.AD_VIEW ||
      input.type === ANALYTICS_EVENT_TYPE.WHATSAPP_CLICK) &&
    !advertisementId
  ) {
    return NextResponse.json(
      { error: "advertisementId é obrigatório" },
      { status: 400 }
    );
  }

  let metadata: Record<string, string> | undefined;
  if (input.metadata && typeof input.metadata === "object") {
    metadata = Object.fromEntries(
      Object.entries(input.metadata as Record<string, unknown>)
        .filter(([, value]) => typeof value === "string")
        .map(([key, value]) => [key, value as string])
    );
  }

  try {
    await recordAnalyticsEvent({
      type: input.type,
      path,
      advertisementId,
      metadata,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível registrar o evento" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
