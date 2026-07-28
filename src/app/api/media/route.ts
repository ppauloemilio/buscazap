import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { isPrivateBlobUrl, isVercelBlobUrl } from "@/lib/blob-access";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url || !isVercelBlobUrl(url)) {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  try {
    const access = isPrivateBlobUrl(url) ? "private" : "public";
    const result = await get(url, { access });

    if (!result) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    const contentType =
      result.blob.contentType && result.blob.contentType !== "application/octet-stream"
        ? result.blob.contentType
        : "image/jpeg";

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": contentType,
        // Cache no browser; evita CDN compartilhar conteúdo de store privado.
        "Cache-Control": isPrivateBlobUrl(url)
          ? "private, max-age=86400"
          : "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[api/media] falha ao buscar blob", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o arquivo" },
      { status: 502 }
    );
  }
}
