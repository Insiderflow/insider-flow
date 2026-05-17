import { API_BASE_URL, USE_API, USE_FIXTURE_BUILDERS, USE_SNAPSHOT } from '@/api/config';
import { mobileApi } from '@/api/endpoints';
import {
  getSnapshotIssuerProfile,
  getSnapshotPersonProfile,
  getSnapshotProfile,
} from '@/api/snapshots';
import {
  getInsiderCompanyProfile as getFixtureCompanyProfile,
  getInsiderEntityProfile as getFixturePersonProfile,
  tickerFromCompanyRouteId,
  type InsiderCompanyProfile,
  type InsiderEntityProfile,
} from '@/data/insiderEntities';
import { getPoliticianImagePath } from '@/lib/politicianImageUrl';
import { ensurePoliticianCharts } from '@/lib/politicianCharts';
import type { IssuerProfile } from '@/data/issuerProfile';

function looksLikeDbId(segment: string): boolean {
  return segment.length >= 18 && /^[a-z0-9_-]+$/i.test(segment);
}

function withPoliticianImage(profile: InsiderEntityProfile): InsiderEntityProfile {
  if (profile.entityType !== 'person' || profile.id.startsWith('person-')) return profile;
  return ensurePoliticianCharts({
    ...profile,
    imageUrl: profile.imageUrl || getPoliticianImagePath(profile.id, profile.name),
  });
}

function profileApiHint(): string {
  return API_BASE_URL && !API_BASE_URL.includes('localhost')
    ? ' Production may not expose /api/mobile/* yet.'
    : ' Is insider-flow/web running on port 3000?';
}

export async function fetchCompanyProfileFromApi(
  id: string
): Promise<InsiderCompanyProfile | null> {
  if (USE_FIXTURE_BUILDERS) {
    return getFixtureCompanyProfile(id);
  }

  if (USE_SNAPSHOT) {
    const snap = getSnapshotProfile(id);
    if (snap && snap.entityType === 'company') {
      return { ...snap, id } as InsiderCompanyProfile;
    }
    return null;
  }

  const ticker = tickerFromCompanyRouteId(id);
  if (!ticker) return null;

  try {
    const profile = await mobileApi.companyProfile(ticker);
    return { ...profile, id: `company-${ticker.toLowerCase()}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Company profile API failed (${ticker}): ${msg}.${profileApiHint()}`);
  }
}

export async function fetchPersonProfileFromApi(
  id: string
): Promise<InsiderEntityProfile | null> {
  if (USE_FIXTURE_BUILDERS) {
    return getFixturePersonProfile(id);
  }

  if (USE_SNAPSHOT) {
    const snap = getSnapshotPersonProfile(id);
    return snap ? withPoliticianImage(snap) : null;
  }

  if (!USE_API) return null;

  try {
    if (id.startsWith('person-')) {
      const ownerId = id.replace(/^person-/, '');
      if (!looksLikeDbId(ownerId)) return null;
      const profile = await mobileApi.personProfile({ ownerId });
      return { ...profile, id };
    }

    const profile = await mobileApi.personProfile({ politicianId: id });
    return withPoliticianImage({ ...profile, id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Person profile API failed (${id}): ${msg}.${profileApiHint()}`);
  }
}

export async function fetchIssuerProfileFromApi(
  idOrTicker: string
): Promise<IssuerProfile | null> {
  if (USE_SNAPSHOT) {
    return getSnapshotIssuerProfile(idOrTicker);
  }
  if (!USE_API) return null;
  try {
    return await mobileApi.issuerProfile(idOrTicker);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Issuer profile API failed (${idOrTicker}): ${msg}.${profileApiHint()}`);
  }
}
