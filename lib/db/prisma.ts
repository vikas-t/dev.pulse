import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma client singleton
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// For development, store client in global to prevent multiple instances during hot reload
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
