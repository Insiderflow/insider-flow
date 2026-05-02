/** Validate Facebook Login access_token and load `/me` (server-side only — uses app secret). */

export type FacebookIdentityPayload = {
  sub: string;
  email?: string;
  name?: string;
};

export async function verifyFacebookAccessToken(accessToken: string): Promise<FacebookIdentityPayload> {
  const appId = process.env.FACEBOOK_CLIENT_ID?.trim();
  const appSecret = process.env.FACEBOOK_CLIENT_SECRET?.trim();
  if (!appId || !appSecret) {
    throw new Error('Facebook login is not configured');
  }

  const debugParams = new URLSearchParams({
    input_token: accessToken,
    access_token: `${appId}|${appSecret}`,
  });
  const debugRes = await fetch(`https://graph.facebook.com/debug_token?${debugParams}`);
  const debugJson = (await debugRes.json()) as {
    data?: { app_id?: string; is_valid?: boolean };
    error?: { message?: string };
  };

  if (debugJson.error?.message) {
    throw new Error(debugJson.error.message);
  }

  const data = debugJson.data;
  if (!data?.is_valid || String(data.app_id) !== appId) {
    throw new Error('Invalid Facebook access token');
  }

  const meParams = new URLSearchParams({
    fields: 'id,email,name',
    access_token: accessToken,
  });
  const meRes = await fetch(`https://graph.facebook.com/me?${meParams}`);
  const me = (await meRes.json()) as {
    id?: string;
    email?: string;
    name?: string;
    error?: { message?: string };
  };

  if (me.error?.message) {
    throw new Error(me.error.message);
  }
  if (!me.id) {
    throw new Error('Facebook profile unavailable');
  }

  return { sub: me.id, email: me.email, name: me.name };
}
