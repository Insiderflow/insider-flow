import {
  clearMobileTokens,
  getAccessToken,
  getRefreshToken,
  isMobileTransport,
} from '@/lib/authTransport';

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(path, {
    credentials: 'include',
    headers,
    ...options,
  });

  if (!res.ok) {
    let payload = {};
    try {
      payload = await res.json();
    } catch {
      payload = {};
    }
    const err = new Error(payload.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = payload;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

async function invokeFunction(name, payload = {}) {
  if (name === 'stripeCheckout') {
    return request('/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  if (name === 'stripePortal') {
    return request('/api/stripe/portal', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  throw new Error(`Unsupported function: ${name}`);
}

const watchlistEntity = {
  async list() {
    const data = await request('/api/watchlist');
    return data.watchlist || [];
  },
  async filter(query = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v));
    });
    const data = await request(`/api/watchlist?${params.toString()}`);
    return data.watchlist || [];
  },
  async create(payload) {
    const data = await request('/api/watchlist', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.watchlistItem;
  },
  async delete(id) {
    const items = await watchlistEntity.list();
    const target = items.find((it) => it.id === id);
    if (!target) return { success: true };

    const params = new URLSearchParams();
    params.set('type', target.watchlist_type || target.type);
    if (target.politician_id || target.politicianId) params.set('politicianId', target.politician_id || target.politicianId);
    if (target.company_id || target.companyId) params.set('companyId', target.company_id || target.companyId);
    if (target.owner_id || target.ownerId) params.set('ownerId', target.owner_id || target.ownerId);
    if (target.ticker) params.set('ticker', target.ticker);
    return request(`/api/watchlist?${params.toString()}`, { method: 'DELETE' });
  },
};

const unsupportedEntity = {
  async list() { return []; },
  async filter() { return []; },
  async create() { throw new Error('Not implemented yet'); },
  async delete() { throw new Error('Not implemented yet'); },
};

export const appClient = {
  auth: {
    async me() {
      const data = await request(isMobileTransport() ? '/api/mobile/auth/me' : '/api/auth/me');
      return data.user;
    },
    async isAuthenticated() {
      try {
        await appClient.auth.me();
        return true;
      } catch {
        return false;
      }
    },
    redirectToLogin(returnUrl = '/') {
      const encoded = encodeURIComponent(returnUrl || '/');
      window.location.href = `/welcome?next=${encoded}`;
    },
    async logout(redirectUrl) {
      try {
        if (isMobileTransport()) {
          const refreshToken = getRefreshToken();
          await request('/api/mobile/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });
          clearMobileTokens();
        } else {
          await request('/api/auth/logout', { method: 'POST' });
        }
      } catch {
        // best effort logout
      }
      if (redirectUrl) window.location.href = '/welcome';
    },
  },
  functions: {
    async invoke(name, payload) {
      const data = await invokeFunction(name, payload);
      return { data };
    },
  },
  entities: {
    WatchlistItem: watchlistEntity,
    PoliticianTrade: unsupportedEntity,
    CorporateInsiderTrade: unsupportedEntity,
    OpenInsiderTransaction: unsupportedEntity,
    OpenInsiderCompany: unsupportedEntity,
    OpenInsiderOwner: unsupportedEntity,
  },
};

