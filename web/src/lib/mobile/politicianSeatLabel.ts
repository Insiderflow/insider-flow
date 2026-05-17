import type { SectorName } from '@/lib/politiciansBySector';
import { politicianSeatDisplayTitle, resolvePoliticianSeatSector } from '@/lib/seatSector';

export function politicianTradeSeatLabel(input: {
  politicianId: string;
  committees?: string | null;
  tradeTicker?: string | null;
  issuerSector?: string | null;
}): { title: string; titleKey: SectorName | 'Other' } {
  const sector = resolvePoliticianSeatSector(
    input.politicianId,
    input.committees,
    input.tradeTicker,
    input.issuerSector,
  );
  const titleKey = sector ?? 'Other';
  return { title: politicianSeatDisplayTitle(sector), titleKey };
}
