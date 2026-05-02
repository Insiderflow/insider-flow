'use strict';

const BASE = 'https://finnhub.io/api/v1';

/** @param {string} token */
async function finnhubGet(token, pathname, searchParams = {}) {
  const u = new URL(BASE + pathname);
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v != null && v !== '') u.searchParams.set(k, String(v));
  });
  u.searchParams.set('token', token);
  const res = await fetch(u, { headers: { 'User-Agent': 'InsiderFlow/finnhub_client' } });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text };
  }
  if (!res.ok) {
    const err = new Error(`Finnhub ${res.status}: ${text.slice(0, 240)}`);
    err.body = json;
    throw err;
  }
  if (json && json.error) {
    const err = new Error(String(json.error));
    err.body = json;
    throw err;
  }
  return json;
}

module.exports = { finnhubGet };
