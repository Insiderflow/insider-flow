import * as jose from 'jose';

const APPLE_ISSUER = 'https://appleid.apple.com';
const JWKS = jose.createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`));

export type AppleIdentityPayload = {
  sub: string;
  email?: string;
};

/** Verify Sign in with Apple `identity_token` (JWT). `audience` must be the iOS bundle identifier. */
export async function verifyAppleIdentityToken(
  identityToken: string,
  audience: string,
): Promise<AppleIdentityPayload> {
  const { payload } = await jose.jwtVerify(identityToken, JWKS, {
    issuer: APPLE_ISSUER,
    audience,
  });
  const sub = typeof payload.sub === 'string' ? payload.sub : '';
  if (!sub) {
    throw new Error('Invalid Apple token: missing subject');
  }
  const email = typeof payload.email === 'string' ? payload.email : undefined;
  return { sub, email };
}
