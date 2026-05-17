import { USE_API } from '@/api/config';
import { apiClient } from '@/api/client';

export interface DataFreshnessResponse {
  ok: boolean;
  latest?: {
    published_at: string | null;
    traded_at: string | null;
  };
}

export async function fetchDataFreshness(): Promise<DataFreshnessResponse | null> {
  if (!USE_API) return null;
  try {
    return await apiClient.get<DataFreshnessResponse>('/api/health/data-freshness');
  } catch {
    return null;
  }
}
