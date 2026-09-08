import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Configure Prisma with logging in development and error logging in production
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development'
    ? [
        { level: 'query' as const, emit: 'event' as const },
        { level: 'error' as const, emit: 'stdout' as const },
        { level: 'warn' as const, emit: 'stdout' as const },
      ]
    : [
        { level: 'error' as const, emit: 'stdout' as const },
        { level: 'warn' as const, emit: 'stdout' as const },
      ],
};

export const db = globalForPrisma.prisma || new PrismaClient(prismaClientOptions);

if (process.env.NODE_ENV === 'development') {
  // Log slow queries (>500ms) in development only
  db.$on('query' as never, (e: { duration: number; query: string }) => {
    if (e.duration > 500) {
      console.warn(`[DB] Slow query (${e.duration}ms):`, e.query.slice(0, 200));
    }
  });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Graceful shutdown
if (typeof process !== 'undefined') {
  const shutdown = async () => {
    await db.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
