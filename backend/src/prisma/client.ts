import { PrismaClient } from '@prisma/client';
import { config } from '../config/env';

// Singleton pattern: in development, reuse the instance across hot-reloads
// to avoid exhausting MongoDB connection limits.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: config.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (config.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
