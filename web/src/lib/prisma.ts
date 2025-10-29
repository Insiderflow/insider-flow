import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // timeouts kept default; avoid connecting in edge middleware
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Ensure required timestamps exist for third-party adapters (e.g., NextAuth)
prisma.$use(async (params, next) => {
  if (params.model === 'User') {
    if (params.action === 'create') {
      params.args.data = {
        created_at: new Date(),
        updated_at: new Date(),
        ...(params.args.data || {}),
      };
    } else if (params.action === 'update' || params.action === 'updateMany') {
      params.args.data = {
        ...(params.args.data || {}),
        updated_at: new Date(),
      };
    }
  }
  return next(params);
});



