// src/services/db.ts
// Database Service Layer Singleton Client
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

/**
 * Instance Singleton PrismaClient untuk seluruh lapisan service dan server action.
 * Menghindari kebocoran koneksi pool ke database PostgreSQL akibat Hot Module Replacement (HMR) Next.js di mode development.
 */
export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error']
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
