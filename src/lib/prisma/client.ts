import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const global_for_prisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function create_prisma_client(): PrismaClient {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = global_for_prisma.prisma ?? create_prisma_client();

if (process.env.NODE_ENV !== "production") {
  global_for_prisma.prisma = prisma;
}

export default prisma;
