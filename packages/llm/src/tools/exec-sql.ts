import { z } from "zod";

import type { ITool, ToolCallResult } from "../types/tools.js";

const MAX_ROWS = 500;

const execSqlInputSchema = z.object({
  sql_query: z
    .string()
    .describe(
      "The SQL query to execute against the DuckDB analytical database. Use standard SQL syntax.",
    ),
});

/**
 * Tool that executes SQL queries against a DuckDB database.
 * The DuckDB instance is injected at construction time.
 */
export class ExecSqlTool implements ITool {
  name = "exec_sql";
  description = `Execute a SQL query against the analytical DuckDB database. Returns results as JSON.
Use this tool to explore data, answer questions, and prepare data for visualizations.
Results are limited to ${MAX_ROWS} rows. Use LIMIT clauses for large datasets.`;
  inputSchema = execSqlInputSchema;

  private readonly queryFn: (
    sql: string,
  ) => Promise<Array<Record<string, unknown>>>;

  constructor(
    queryFn: (sql: string) => Promise<Array<Record<string, unknown>>>,
  ) {
    this.queryFn = queryFn;
  }

  async execute(args: Record<string, unknown>): Promise<ToolCallResult> {
    const parsed = execSqlInputSchema.parse(args);
    const { sql_query } = parsed;

    try {
      const rows = await this.queryFn(sql_query);

      const truncated = rows.slice(0, MAX_ROWS);
      const wasTruncated = rows.length > MAX_ROWS;

      const output = JSON.stringify({
        rows: truncated,
        rowCount: truncated.length,
        totalRows: rows.length,
        ...(wasTruncated
          ? {
              warning: `Results truncated to ${MAX_ROWS} rows. Use a LIMIT clause for more precise results.`,
            }
          : {}),
      });

      return { shouldRunAgain: true, output };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        shouldRunAgain: true,
        output: `SQL execution error: ${errorMessage}`,
      };
    }
  }
}
