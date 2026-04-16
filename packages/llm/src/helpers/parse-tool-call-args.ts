import type { z } from "zod";

/**
 * Parse raw tool call arguments through the tool's Zod schema.
 *
 * Handles several edge cases from the Anthropic API:
 * 1. Arguments may be a JSON string instead of an object
 * 2. Arguments may be wrapped in an `args` container: `{ args: { ... } }`
 * 3. Arguments may be double-wrapped or nested
 */
export function parseToolCallArgs<T extends z.ZodTypeAny>(
  rawArgs: string | Record<string, unknown>,
  schema: T,
): z.infer<T> {
  let parsed: Record<string, unknown>;

  if (typeof rawArgs === "string") {
    try {
      parsed = JSON.parse(rawArgs) as Record<string, unknown>;
    } catch {
      throw new Error(`Failed to parse tool call arguments: ${rawArgs}`);
    }
  } else {
    parsed = rawArgs;
  }

  // Unwrap the `args` container if present
  if (
    "args" in parsed &&
    typeof parsed.args === "object" &&
    parsed.args !== null
  ) {
    parsed = parsed.args as Record<string, unknown>;
  }

  const result = schema.safeParse(parsed);
  if (result.success) {
    return result.data as z.infer<T>;
  }

  // Fallback: try unwrapping nested args one more time
  if (
    "args" in parsed &&
    typeof parsed.args === "object" &&
    parsed.args !== null
  ) {
    const nestedResult = schema.safeParse(parsed.args);
    if (nestedResult.success) {
      return nestedResult.data as z.infer<T>;
    }
  }

  throw new Error(
    `Tool call argument validation failed: ${result.error.message}`,
  );
}
