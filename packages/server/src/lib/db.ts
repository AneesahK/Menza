import { createDbClient } from "@demo/db";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const { db, pool } = createDbClient(databaseUrl, {
  min: 2,
  max: 10,
});

export { db, pool };
