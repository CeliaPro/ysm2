import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Handle cleanup in production
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else {
  prisma.$connect(); // Ensure initial connection in production
}

// Cleanup connections on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});