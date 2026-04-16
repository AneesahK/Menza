import type { ExtractTablesWithRelations } from "drizzle-orm";
import { Pool } from "pg";

import * as schema from "./schema/index.js";
import { drizzle, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";

export type DatabaseTransaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type DbClient = ReturnType<typeof drizzle<typeof schema>>;

export interface DbClientOptions {
  min?: number;
  max?: number;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  allowExitOnIdle?: boolean;
}

export function createDbClient(
  databaseUrl: string,
  options?: DbClientOptions,
): { db: DbClient; pool: Pool } {
  const pool = new Pool({
    connectionString: databaseUrl,
    min: options?.min ?? 2,
    max: options?.max ?? 10,
    connectionTimeoutMillis: options?.connectionTimeoutMillis ?? 5000,
    idleTimeoutMillis: options?.idleTimeoutMillis ?? 60000,
    allowExitOnIdle: options?.allowExitOnIdle ?? false,
  });

  pool.on("error", (err) => {
    console.error("pg pool background error", err.message);
  });

  const db = drizzle({
    schema,
    client: pool,
  });

  return { db, pool };
}
