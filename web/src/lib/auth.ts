import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { prisma } from './prisma';
import { sendPasswordResetEmail } from './email';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/nextauthOptions';
import { verifyAppleIdentityToken } from '@/lib/appleAuth';
import { verifyGoogleIdToken } from '@/lib/googleAuth';
import { verifyFacebookAccessToken } from '@/lib/facebookAuth';

// const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret-for-development';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

/** Surfaced when `password_hash` is null (OAuth-only accounts). */
export const OAUTH_ONLY_ACCOUNT_MESSAGE =
  'Use social sign-in (Google, Apple, or Facebook)';

function isPrismaUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/** OAuth client IDs whose JWT `aud` we accept for Sign in with Google (Web + optional iOS/Android). */
export function getGoogleJwtAudiences(): string[] {
  const explicit = process.env.GOOGLE_JWT_AUDIENCES?.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  if (explicit?.length) return [...new Set(explicit)];
  const ids = [
    process.env.GOOGLE_CLIENT_ID?.trim(),
    process.env.GOOGLE_IOS_CLIENT_ID?.trim(),
    process.env.GOOGLE_ANDROID_CLIENT_ID?.trim(),
  ].filter(Boolean) as string[];
  return [...new Set(ids)];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user_id: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await prisma.legacySession.create({
    data: {
      id: token,
      user_id,
      token,
      expires_at: expiresAt,
    },
  });

  return token;
}

export async function getSessionUser(incomingRequest?: Request) {
  const authHeader = incomingRequest
    ? incomingRequest.headers.get('authorization')
    : (await headers()).get('authorization');
  const bearerToken = extractBearerToken(authHeader);
  if (bearerToken) {
    const payload = verifyAccessToken(bearerToken);
    if (payload?.sub) {
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (user) return user;
    }
  }

  // Prefer NextAuth session identity when present (web app default auth path).
  // This avoids stale legacy `session` cookies overriding the active signed-in user.
  const nextAuthSession = (await getServerSession(authOptions)) as Session | null;
  if (nextAuthSession?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: nextAuthSession.user.email } });
    if (user) return user;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.legacySession.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session || session.expires_at < new Date()) {
    return null;
  }

  return session.user;
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function logout() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    if (sessionToken) {
      await prisma.legacySession.deleteMany({ where: { token: sessionToken } });
    }
    cookieStore.delete('session');
  } catch {
    // Swallow errors on logout to avoid surfacing 500s
  }
}

export async function createUser(email: string, password: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = generateToken();

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email,
      password_hash: passwordHash,
      email_verification_token: verificationToken,
      email_verified: false, // Require email verification
      updated_at: new Date(),
    },
  });

  // Note: Verification email is sent by the calling route, not here

  return user;
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: { email_verification_token: token },
  });

  if (!user) {
    throw new Error('Invalid verification token');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email_verified: true,
      email_verification_token: null,
    },
  });

  return user;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if user has a password (not OAuth user)
  if (!user.password_hash) {
    throw new Error(OAUTH_ONLY_ACCOUNT_MESSAGE);
  }

  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  const sessionToken = await createSession(user.id);
  // Return token; the API route will set the cookie on the response
  return { user, sessionToken };
}

export async function loginMobile(email: string, password: string) {
  const { user, sessionToken } = await login(email, password);
  const accessToken = createAccessToken(user.id);
  return { user, accessToken, refreshToken: sessionToken };
}

/** Native Sign in with Apple: JWT verified against Apple JWKS; links or creates `Account` + `User`. */
export async function loginOrRegisterAppleMobile(identityToken: string) {
  const bundleAudience = process.env.APPLE_IOS_CLIENT_ID?.trim();
  if (!bundleAudience) {
    throw new Error('Apple Sign-In is not configured');
  }

  const { sub, email } = await verifyAppleIdentityToken(identityToken, bundleAudience);

  const appleAccountWhere = {
    provider_providerAccountId: { provider: 'apple' as const, providerAccountId: sub },
  };

  const findUserByAppleAccount = async () => {
    const row = await prisma.account.findUnique({
      where: appleAccountWhere,
      include: { user: true },
    });
    return row?.user ?? null;
  };

  let user = await findUserByAppleAccount();

  if (!user && email) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      try {
        await prisma.account.create({
          data: {
            userId: byEmail.id,
            type: 'oauth',
            provider: 'apple',
            providerAccountId: sub,
          },
        });
        user = byEmail;
      } catch (err) {
        if (!isPrismaUniqueViolation(err)) throw err;
        user = await findUserByAppleAccount();
      }
    }
  }

  if (!user) {
    user = await createAppleUserAndAccountTransactional(sub, email);
  }

  const sessionToken = await createSession(user.id);
  const accessToken = createAccessToken(user.id);
  return { user, accessToken, refreshToken: sessionToken };
}

async function createAppleUserAndAccountTransactional(sub: string, email?: string) {
  const syntheticLocalPart = sub.replace(/[^a-zA-Z0-9]/g, '').slice(0, 48) || 'user';
  let candidate = email ?? `apple.${syntheticLocalPart}@apple.local.insiderflow`;

  let suffix = 0;
  while (await prisma.user.findUnique({ where: { email: candidate } })) {
    suffix += 1;
    if (suffix > 25) {
      throw new Error('Could not allocate Apple user identity');
    }
    candidate = `apple.${syntheticLocalPart}.${suffix}@apple.local.insiderflow`;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          id: crypto.randomUUID(),
          email: candidate,
          password_hash: null,
          email_verified: true,
          emailVerified: new Date(),
          name: email ? email.split('@')[0] : null,
          updated_at: new Date(),
        },
      });
      await tx.account.create({
        data: {
          userId: created.id,
          type: 'oauth',
          provider: 'apple',
          providerAccountId: sub,
        },
      });
      return created;
    });
  } catch (err) {
    if (!isPrismaUniqueViolation(err)) throw err;
    const linked = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: { provider: 'apple', providerAccountId: sub },
      },
      include: { user: true },
    });
    if (linked?.user) return linked.user;
    throw new Error('Apple sign-in conflict — please try again');
  }
}

/** Native Sign in with Google: verify ID token; link/create `Account` + `User`. */
export async function loginOrRegisterGoogleMobile(idToken: string) {
  const audiences = getGoogleJwtAudiences();
  if (!audiences.length) {
    throw new Error('Google Sign-In is not configured');
  }

  const { sub, email, emailVerified } = await verifyGoogleIdToken(idToken, audiences);

  const googleAccountWhere = {
    provider_providerAccountId: { provider: 'google' as const, providerAccountId: sub },
  };

  const findUserByGoogleAccount = async () => {
    const row = await prisma.account.findUnique({
      where: googleAccountWhere,
      include: { user: true },
    });
    return row?.user ?? null;
  };

  let user = await findUserByGoogleAccount();

  if (!user && email) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      try {
        await prisma.account.create({
          data: {
            userId: byEmail.id,
            type: 'oauth',
            provider: 'google',
            providerAccountId: sub,
          },
        });
        user = byEmail;
      } catch (err) {
        if (!isPrismaUniqueViolation(err)) throw err;
        user = await findUserByGoogleAccount();
      }
    }
  }

  if (!user) {
    user = await createGoogleUserAndAccountTransactional(sub, email, emailVerified);
  }

  const sessionToken = await createSession(user.id);
  const accessToken = createAccessToken(user.id);
  return { user, accessToken, refreshToken: sessionToken };
}

async function createGoogleUserAndAccountTransactional(
  sub: string,
  email: string | undefined,
  googleEmailVerified: boolean,
) {
  const syntheticLocalPart = sub.replace(/[^a-zA-Z0-9]/g, '').slice(0, 48) || 'user';
  let candidate =
    email ?? `google.${syntheticLocalPart}@google.local.insiderflow`;

  let suffix = 0;
  while (await prisma.user.findUnique({ where: { email: candidate } })) {
    suffix += 1;
    if (suffix > 25) {
      throw new Error('Could not allocate Google user identity');
    }
    candidate = `google.${syntheticLocalPart}.${suffix}@google.local.insiderflow`;
  }

  const verified = Boolean(email && googleEmailVerified);

  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          id: crypto.randomUUID(),
          email: candidate,
          password_hash: null,
          email_verified: verified,
          emailVerified: verified ? new Date() : null,
          name: email ? email.split('@')[0] : null,
          updated_at: new Date(),
        },
      });
      await tx.account.create({
        data: {
          userId: created.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: sub,
        },
      });
      return created;
    });
  } catch (err) {
    if (!isPrismaUniqueViolation(err)) throw err;
    const linked = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: { provider: 'google', providerAccountId: sub },
      },
      include: { user: true },
    });
    if (linked?.user) return linked.user;
    throw new Error('Google sign-in conflict — please try again');
  }
}

/** Native Facebook Login: validate Graph token; link/create `Account` + `User`. */
export async function loginOrRegisterFacebookMobile(accessToken: string) {
  const { sub, email, name } = await verifyFacebookAccessToken(accessToken);

  const fbAccountWhere = {
    provider_providerAccountId: { provider: 'facebook' as const, providerAccountId: sub },
  };

  const findUserByFacebookAccount = async () => {
    const row = await prisma.account.findUnique({
      where: fbAccountWhere,
      include: { user: true },
    });
    return row?.user ?? null;
  };

  let user = await findUserByFacebookAccount();

  if (!user && email) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      try {
        await prisma.account.create({
          data: {
            userId: byEmail.id,
            type: 'oauth',
            provider: 'facebook',
            providerAccountId: sub,
          },
        });
        user = byEmail;
      } catch (err) {
        if (!isPrismaUniqueViolation(err)) throw err;
        user = await findUserByFacebookAccount();
      }
    }
  }

  if (!user) {
    user = await createFacebookUserAndAccountTransactional(sub, email, name);
  }

  const sessionToken = await createSession(user.id);
  const accessTokenOut = createAccessToken(user.id);
  return { user, accessToken: accessTokenOut, refreshToken: sessionToken };
}

async function createFacebookUserAndAccountTransactional(
  sub: string,
  email: string | undefined,
  name: string | undefined,
) {
  const syntheticLocalPart = sub.replace(/[^a-zA-Z0-9]/g, '').slice(0, 48) || 'user';
  let candidate = email ?? `fb.${syntheticLocalPart}@facebook.local.insiderflow`;

  let suffix = 0;
  while (await prisma.user.findUnique({ where: { email: candidate } })) {
    suffix += 1;
    if (suffix > 25) {
      throw new Error('Could not allocate Facebook user identity');
    }
    candidate = `fb.${syntheticLocalPart}.${suffix}@facebook.local.insiderflow`;
  }

  const verified = Boolean(email);

  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          id: crypto.randomUUID(),
          email: candidate,
          password_hash: null,
          email_verified: verified,
          emailVerified: verified ? new Date() : null,
          name: name ?? (email ? email.split('@')[0] : null),
          updated_at: new Date(),
        },
      });
      await tx.account.create({
        data: {
          userId: created.id,
          type: 'oauth',
          provider: 'facebook',
          providerAccountId: sub,
        },
      });
      return created;
    });
  } catch (err) {
    if (!isPrismaUniqueViolation(err)) throw err;
    const linked = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: { provider: 'facebook', providerAccountId: sub },
      },
      include: { user: true },
    });
    if (linked?.user) return linked.user;
    throw new Error('Facebook sign-in conflict — please try again');
  }
}

export async function refreshMobileTokens(refreshToken: string) {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  const session = await prisma.legacySession.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });
  if (!session || session.expires_at < new Date()) {
    throw new Error('Invalid refresh token');
  }

  await prisma.legacySession.deleteMany({ where: { token: refreshToken } });
  const newRefreshToken = await createSession(session.user_id);
  const accessToken = createAccessToken(session.user_id);

  return {
    user: session.user,
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutMobile(refreshToken?: string | null) {
  if (!refreshToken) return;
  await prisma.legacySession.deleteMany({ where: { token: refreshToken } });
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists or not
    console.log('[password reset] User not found', { email });
    return;
  }

  // Check if user has a password (not OAuth user)
  if (!user.password_hash) {
    // Don't reveal if user exists or not
    console.log('[password reset] User has no password (OAuth user)', { email, userId: user.id });
    return;
  }

  const resetToken = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_reset_token: resetToken,
        password_reset_expires: expiresAt,
      },
    });

    console.log('[password reset] Token generated', { email, userId: user.id, expiresAt });
    await sendPasswordResetEmail(email, resetToken);
    console.log('[password reset] Email sent successfully', { email });
  } catch (error) {
    console.error('[password reset] Failed to send email', { 
      email, 
      userId: user.id,
      error: error instanceof Error ? error.message : String(error)
    });
    // Re-throw so the API route can handle it
    throw error;
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      password_reset_token: token,
      password_reset_expires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires: null,
    },
  });

  return user;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (!authHeader.toLowerCase().startsWith('bearer ')) return null;
  return authHeader.slice(7).trim();
}

function getAccessTokenSecret() {
  const configuredSecret = process.env.MOBILE_AUTH_SECRET || process.env.SESSION_SECRET;
  if (configuredSecret) return configuredSecret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('MOBILE_AUTH_SECRET or SESSION_SECRET must be set for mobile auth tokens');
  }

  console.warn('MOBILE_AUTH_SECRET and SESSION_SECRET are missing; using development fallback secret');
  return 'fallback-mobile-secret-for-development';
}

function base64UrlEncode(input: string) {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function signAccessTokenPart(value: string) {
  return crypto.createHmac('sha256', getAccessTokenSecret()).update(value).digest('base64url');
}

export function createAccessToken(userId: string): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const headerPart = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadPart = base64UrlEncode(
    JSON.stringify({
      sub: userId,
      iat: nowSeconds,
      exp: nowSeconds + ACCESS_TOKEN_TTL_SECONDS,
    }),
  );
  const unsigned = `${headerPart}.${payloadPart}`;
  const signature = signAccessTokenPart(unsigned);
  return `${unsigned}.${signature}`;
}

function verifyAccessToken(token: string): { sub: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;
  const unsigned = `${headerPart}.${payloadPart}`;
  const expectedSignature = signAccessTokenPart(unsigned);
  if (expectedSignature !== signaturePart) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart)) as { sub?: string; exp?: number };
    if (!payload.sub || !payload.exp) return null;
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSeconds) return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}
