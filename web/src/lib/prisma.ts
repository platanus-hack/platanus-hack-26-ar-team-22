// Prisma 7 requires a driver adapter. We use `@prisma/adapter-pg` so the
// same client works locally (docker postgres) and in prod (Railway / Supabase)
// without changing imports — the connection string is the only knob.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

function build(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const prisma = global.__prisma ?? build();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
