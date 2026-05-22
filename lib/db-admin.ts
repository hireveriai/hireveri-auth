// lib/db-admin.ts
import { Pool } from "pg";

declare global {
  // Reuse a single pool per server process to avoid stacking connections.
  var __hireveriAdminPool: Pool | undefined;
}

export function getPool() {
  if (!global.__hireveriAdminPool) {
    const connectionString =
      process.env.DB_POOL_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL_NON_POOLING;

    global.__hireveriAdminPool = new Pool({
      ...(connectionString
        ? { connectionString }
        : {
            user: process.env.DB_USER!,
            password: process.env.DB_PASSWORD!,
            host: process.env.DB_HOST!,
            port: Number(process.env.DB_PORT ?? 5432),
            database: process.env.DB_NAME!,
          }),
      max: Number(process.env.DB_POOL_MAX ?? 1),
      idleTimeoutMillis: Number(
        process.env.DB_IDLE_TIMEOUT_MS ?? 100
      ),
      connectionTimeoutMillis: Number(
        process.env.DB_CONNECTION_TIMEOUT_MS ?? 2_500
      ),
      maxUses: Number(process.env.DB_MAX_USES ?? 7_500),
      maxLifetimeSeconds: Number(
        process.env.DB_MAX_LIFETIME_SECONDS ?? 60
      ),
      allowExitOnIdle: true,
      ssl:
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  return global.__hireveriAdminPool;
}
