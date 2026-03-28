import { PrismaClient } from "@prisma/client"

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
}

// Singleton pattern — prevents multiple connections in dev (Next.js hot reload)
export const db: PrismaClient = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db
}
