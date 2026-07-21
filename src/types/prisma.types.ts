import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma interactive transaction client type.
 * Use this to type `tx` parameters inside prisma.$transaction(async (tx) => { ... })
 *
 * Example:
 *   import type { TxClient } from "@/types/prisma.types";
 *   prisma.$transaction(async (tx: TxClient) => { ... })
 */
export type TxClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];