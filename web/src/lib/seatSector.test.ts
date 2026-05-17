import { describe, expect, it } from 'vitest';
import {
  inferSeatSectorFromCommittees,
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
});
