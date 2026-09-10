import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = global as any;

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter }); //, log: ["query", "info", "warn", "error"],

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = prisma;