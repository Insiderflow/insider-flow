import * as jose from 'jose';

const JWKS = jose.createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export type GoogleIdentityPayload = {
  sub: string;
  email?: string;
  emailVerified: boolean;
};

/** Verify Google Sign-In `id_token`. `allowedAudiences` should include Web / iOS / Android OAuth client IDs as configured in GCP. */
export async function verifyGoogleIdToken(
  idToken: string,
  allowedAudiences: string[],
): Promise<GoogleIdentityPayload> {
  if (!allowedAudiences.length) {
    throw new Error('Google Sign-In is not configured');
  }

  const { payload } = await jose.jwtVerify(idToken, JWKS, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
  });

  const audClaim = payload.aud;
  const audValues = Array.isArray(audClaim)
    ? audClaim.map(String)
    : audClaim != null
      ? [String(audClaim)]
      : [];

  const audienceOk = allowedAudiences.some((a) => audValues.includes(a));
  if (!audienceOk) {
    throw new Error('Invalid Google token audience');
  }

  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  if (!sub) {
    throw new Error('Invalid Google token: missing subject');
  }

  const email = typeof payload.email === 'string' ? payload.email : undefined;
  const emailVerified =
    payload.email_verified === true ||
    payload.email_verified === 'true' ||
    payload.email_verified === 'True';

  return { sub, email, emailVerified };
}
