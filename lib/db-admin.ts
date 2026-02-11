// lib/db-admin.ts
import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      host: process.env.DB_HOST!,
      port: Number(process.env.DB_PORT ?? 5432),
      database: process.env.DB_NAME!,
      ssl:
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  return pool;
}
