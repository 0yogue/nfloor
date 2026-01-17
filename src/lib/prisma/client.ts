import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const global_for_prisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function get_prisma_client(): PrismaClient {
  if (global_for_prisma.prisma) {
    return global_for_prisma.prisma;
  }

  const connection_string = process.env.DATABASE_URL;
  
  if (!connection_string) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  const pool = new Pool({ connectionString: connection_string });
  global_for_prisma.pool = pool;
  
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    global_for_prisma.prisma = client;
  }

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = get_prisma_client();
    return (client as unknown as Record<string, unknown>)[prop as string];
  },
});

export default prisma;
