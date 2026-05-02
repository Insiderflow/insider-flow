import { NextRequest, NextResponse } from "next/server";
import {
  SECTOR_NAMES,
  getPoliticiansBySector,
  type Politician,
  type SectorName,
} from "@/lib/politiciansBySector";

function normalizeSectorInput(raw: string | null): SectorName | null {
  if (!raw) return null;
  const matched = SECTOR_NAMES.find((s) => s.toLowerCase() === raw.trim().toLowerCase()) || null;
  return matched;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSector = searchParams.get("sector");
    const sector = normalizeSectorInput(rawSector);

    if (!sector) {
      return NextResponse.json(
        {
          error: "Invalid sector",
          validSectors: SECTOR_NAMES,
        },
        { status: 400 },
      );
    }

    const politicians = await getPoliticiansBySector(sector);

    // Return the same shape the mobile app expects.
    // (sector + politicians[], where each politician includes tradeCountInSector, lastTradeDate, totalVolumeInSector).
    return NextResponse.json({
      sector,
      politicians: politicians as Politician[],
    });
  } catch (error) {
    console.error("[politicians-by-sector] failed", error);
    return NextResponse.json({ error: "Failed to fetch politicians by sector" }, { status: 500 });
  }
}

