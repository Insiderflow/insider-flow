import { describe, expect, it } from 'vitest';
import {
  explainCommitteeSectorAlignment,
  inferSeatSectorFromCommittees,
  inferSeatSectorsFromCommittees,
  resolveIssuerTradeSector,
  resolvePoliticianCommittees,
  resolvePoliticianSeatSector,
} from '@/lib/seatSector';

describe('seatSector', () => {
  it('maps intelligence committee to Communication Services', () => {
    expect(inferSeatSectorFromCommittees('Senate Intelligence')).toBe('Communication Services');
  });

  it('maps science committee toward Information Technology', () => {
    expect(inferSeatSectorFromCommittees('House Committee on Science, Space, and Technology')).toBe(
      'Information Technology',
    );
  });

  it('resolves issuer sector from ticker when DB sector missing', () => {
    expect(resolveIssuerTradeSector('GOOGL', null)).toBe('Communication Services');
    expect(resolveIssuerTradeSector('MSFT', null)).toBe('Information Technology');
  });

  it('resolvePoliticianSeatSector prefers committees over trade issuer', () => {
    expect(
      resolvePoliticianSeatSector('X', 'Senate Banking', 'AAPL', 'Information Technology'),
    ).toBe('Financials');
    expect(resolvePoliticianSeatSector('X', null, 'AAPL', null)).toBe('Information Technology');
  });

  it('resolvePoliticianCommittees prefers DB value over seed', () => {
    expect(resolvePoliticianCommittees('unknown-id', 'Senate Banking')).toBe('Senate Banking');
  });

  it('inferSeatSectorsFromCommittees returns multiple sectors for broad committees', () => {
    const sectors = inferSeatSectorsFromCommittees('House Energy and Commerce');
    expect(sectors.length).toBeGreaterThan(1);
    expect(sectors).toContain('Energy');
  });

  it('resolveIssuerTradeSector uses sub-sector taxonomy slug', () => {
    expect(resolveIssuerTradeSector('NVDA', null, 'it-semiconductors')).toBe(
      'Information Technology',
    );
  });

  it('explainCommitteeSectorAlignment matches when trade in any committee sector', () => {
    const align = explainCommitteeSectorAlignment({
      politicianId: 'p1',
      committees: 'House Energy and Commerce',
      ticker: 'XOM',
      issuerSector: null,
    });
    expect(align.met).toBe(true);
    expect(align.tradeSector).toBe('Energy');
  });

  it('prefers GovTrack codes over regex on committee text', () => {
    const align = explainCommitteeSectorAlignment({
      politicianId: 'p1',
      committees: 'Irrelevant text',
      committeeAssignments: [{ code: 'SSBK', name: 'Senate Banking' }],
      ticker: 'JPM',
      issuerSector: null,
    });
    expect(align.usedGovtrackMap).toBe(true);
    expect(align.met).toBe(true);
    expect(align.committeeCodes).toContain('SSBK');
  });
});
