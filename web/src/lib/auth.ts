import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { sendPasswordResetEmail } from './email';
import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret-for-development';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// Only warn in production, don't throw error
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: SESSION_SECRET not set in production, using fallback');
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

  await prisma.session.create({
    data: {
      id: token,
      user_id,
      token,
      expires_at: expiresAt,
    },
  });

  return token;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { User: true },
  });

  if (!session || session.expires_at < new Date()) {
    return null;
  }

  return session.User;
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({
      where: { token: sessionToken },
    });
  }

  cookieStore.delete('session');
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

  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  const sessionToken = await createSession(user.id);
  // Return token; the API route will set the cookie on the response
  return { user, sessionToken };
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists or not
    return;
  }

  const resetToken = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_reset_token: resetToken,
      password_reset_expires: expiresAt,
    },
  });

  await sendPasswordResetEmail(email, resetToken);
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
