import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { isPrivateBlobUrl } from "@/lib/blob-access";

function isAllowedBlobUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url || !isAllowedBlobUrl(url)) {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  const access = isPrivateBlobUrl(url) ? "private" : "public";
  const result = await get(url, { access });

  if (!result) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
