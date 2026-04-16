import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { DuckDBInstance, type DuckDBConnection } from "@duckdb/node-api";

/**
 * Resolve the path to the DuckDB warehouse file.
 * Looks for `data/warehouse.duckdb` relative to the repo root.
 */
function getWarehousePath(): string {
  const candidates = [
    resolve(process.cwd(), "data", "warehouse.duckdb"),
    resolve(process.cwd(), "..", "data", "warehouse.duckdb"),
    resolve(process.cwd(), "..", "..", "data", "warehouse.duckdb"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return resolve(process.cwd(), "data", "warehouse.duckdb");
}

// Singleton DuckDB connection (read-only, shared across queries)
let connectionPromise: Promise<DuckDBConnection> | null = null;

function getConnection(): Promise<DuckDBConnection> {
  if (!connectionPromise) {
    connectionPromise = (async () => {
      const dbPath = getWarehousePath();

      if (!existsSync(dbPath)) {
        throw new Error(
          `DuckDB warehouse not found at ${dbPath}. Run the seed script first.`,
        );
      }

      console.log(`Opening DuckDB warehouse: ${dbPath}`);
      const instance = await DuckDBInstance.create(dbPath, {
        access_mode: "READ_ONLY",
      });
      return instance.connect();
    })();
  }
  return connectionPromise;
}

/**
 * Convert a DuckDB value to a JSON-safe primitive.
 * Handles BigInt, DuckDBDecimalValue, Date, and nested structures.
 */
function toJsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Date) return value.toISOString();

  // DuckDBDecimalValue: { value: bigint, scale: number, width: number }
  if (
    typeof value === "object" &&
    "value" in value &&
    "scale" in value &&
    typeof (value as Record<string, unknown>).value === "bigint"
  ) {
    const dec = value as { value: bigint; scale: number };
    return Number(dec.value) / 10 ** dec.scale;
  }

  if (Array.isArray(value)) return value.map(toJsonSafe);

  // Plain objects (e.g. nested structs)
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const converted: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      converted[k] = toJsonSafe(v);
    }
    return converted;
  }

  return value;
}

/**
 * Create a DuckDB query function that executes SQL against the
 * read-only warehouse and returns results as an array of objects.
 */
export function createDuckDbQueryFn(): (
  sql: string,
) => Promise<Array<Record<string, unknown>>> {
  return async (sql: string): Promise<Array<Record<string, unknown>>> => {
    const connection = await getConnection();
    const reader = await connection.runAndReadAll(sql);
    const rows = reader.getRowObjects() as Array<Record<string, unknown>>;

    // DuckDB returns special types that aren't JSON-serializable:
    // - BigInt for COUNT(*), SUM(), etc.
    // - DuckDBDecimalValue { value: bigint, scale: number } for DECIMAL columns
    // - Date objects for DATE columns
    // Convert everything to JSON-safe primitives.
    return rows.map((row) => {
      const converted: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        converted[key] = toJsonSafe(value);
      }
      return converted;
    });
  };
}

/**
 * Fetch the DuckDB schema as a formatted string for the system prompt.
 * Queries information_schema.columns to discover all tables and columns.
 */
export async function getDataSourceContext(
  queryFn: (sql: string) => Promise<Array<Record<string, unknown>>>,
): Promise<string> {
  try {
    const rows = await queryFn(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'main'
      ORDER BY table_name, ordinal_position
    `);

    const tables = new Map<string, Array<{ column: string; type: string }>>();
    for (const row of rows) {
      const tableName = String(row.table_name);
      const columnName = String(row.column_name);
      const dataType = String(row.data_type);

      if (!tables.has(tableName)) {
        tables.set(tableName, []);
      }
      tables.get(tableName)!.push({ column: columnName, type: dataType });
    }

    const lines: Array<string> = [];
    for (const [tableName, columns] of tables) {
      lines.push(`Table: ${tableName}`);
      for (const col of columns) {
        lines.push(`  - ${col.column} (${col.type})`);
      }
      lines.push("");
    }

    return lines.join("\n");
  } catch (error) {
    console.error("Failed to fetch DuckDB schema:", error);
    return "Unable to fetch data source schema. The DuckDB warehouse may not be configured.";
  }
}
