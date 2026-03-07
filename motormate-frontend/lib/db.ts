import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // max:1 for serverless (Vercel) — Supabase pooler handles the actual pooling
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: process.env.NODE_ENV === 'production' ? 1 : 10,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
