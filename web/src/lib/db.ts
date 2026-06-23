import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { withAccelerate } from '@prisma/extension-accelerate';

const connectionString =
  process.env.loomo_PRISMA_DATABASE_URL ||
  process.env.loomo_DATABASE_URL ||
  process.env.loomo_POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:admin123@127.0.0.1:5432/loomo_db?schema=public";

const isPrismaPostgres =
  connectionString.startsWith("prisma://") ||
  connectionString.startsWith("prisma+postgres://");

const globalForPrisma = global as unknown as {
  prisma: any;
  pool: Pool | undefined;
};

let prismaInstance: any;

if (isPrismaPostgres) {
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({} as any).$extends(withAccelerate());
} else {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
  }

  const adapter = new PrismaPg(globalForPrisma.pool);
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter,
    });
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance as unknown as PrismaClient;

// Start the background job scheduler
import { startScheduler } from './scheduler';
if (typeof window === 'undefined') {
  startScheduler();
}

