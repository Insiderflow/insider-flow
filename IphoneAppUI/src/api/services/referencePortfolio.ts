import { USE_FIXTURE_BUILDERS } from '@/api/config';
import {
  mobileApi,
  type ReferencePortfolioPayload,
  type ReferencePortfolioTemplate,
} from '@/api/endpoints';

export async function fetchReferencePortfolios(): Promise<ReferencePortfolioPayload> {
  if (USE_FIXTURE_BUILDERS) {
    return { portfolios: [], maxPortfolios: 3, presets: [] };
  }
  return mobileApi.referencePortfolios();
}

export async function createReferencePortfolio(body: {
  id?: string;
  name?: string;
  template: ReferencePortfolioTemplate;
  politicianId?: string;
  periodDays?: number;
  positionLimit?: number;
}) {
  return mobileApi.referencePortfolioSave(body);
}

export async function deleteReferencePortfolio(id: string) {
  return mobileApi.referencePortfolioDelete(id);
}
