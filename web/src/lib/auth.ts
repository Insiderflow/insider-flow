import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { sendVerificationEmail, sendPasswordResetEmail } from './email';
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

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
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
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
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
      email,
      passwordHash,
      emailVerificationToken: verificationToken,
    },
  });

  // Send verification email
  await sendVerificationEmail(email, verificationToken);

  return user;
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token },
  });

  if (!user) {
    throw new Error('Invalid verification token');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
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

  const isValidPassword = await verifyPassword(password, user.passwordHash);
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
      passwordResetToken: resetToken,
      passwordResetExpires: expiresAt,
    },
  });

  await sendPasswordResetEmail(email, resetToken);
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
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
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return user;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
