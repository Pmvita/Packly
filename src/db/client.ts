import { PrismaClient } from '@/generated/prisma';

type GlobalWithPrisma = typeof globalThis & {
  __packlyPrisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

function createClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['info', 'warn', 'error']
        : ['warn', 'error'],
  });
}

const prisma =
  process.env.NODE_ENV === 'production'
    ? createClient()
    : (globalForPrisma.__packlyPrisma ??= createClient());

export { prisma };

