import type { ZodSchema } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Convert a Zod schema into a JSON Schema definitions object.
 * Returns `{ args: { type: "object", properties: {...}, ... } }` which
 * is used as the `definitions` block in the Anthropic tool `input_schema`.
 *
 * The caller then references this via `$ref: "#/definitions/args"`.
 */
export function generateToolJsonSchema(
  schema: ZodSchema,
): Record<string, unknown> | undefined {
  const jsonSchema = zodToJsonSchema(schema, {
    name: "args",
    nameStrategy: "ref",
    $refStrategy: "root",
    definitionPath: "definitions",
    target: "jsonSchema7",
  });

  const toolSchema = jsonSchema.definitions as
    | Record<string, unknown>
    | undefined;

  return toolSchema;
}
