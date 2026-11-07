import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/reverse-geocode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseCoordinate(
  value: string | null,
  label: string,
  min: number,
  max: number
): number | null {
  if (value == null || value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} inválida.`);
  }
  return parsed;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseCoordinate(searchParams.get("lat"), "Latitude", -90, 90);
    const lng = parseCoordinate(
      searchParams.get("lng") ?? searchParams.get("lon"),
      "Longitude",
      -180,
      180
    );

    if (lat == null || lng == null) {
      return NextResponse.json(
        { ok: false, error: "Informe lat e lng." },
        { status: 400 }
      );
    }

    const place = await reverseGeocode(lat, lng);

    if (!place.city) {
      return NextResponse.json(
        {
          ok: false,
          error: "Não encontramos uma cidade para essa localização.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      city: place.city,
      neighborhood: place.neighborhood,
      state: place.state,
      displayName: place.displayName,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao obter localização.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
