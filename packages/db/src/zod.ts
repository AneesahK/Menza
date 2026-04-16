import { z } from "zod";

export const stringToJSONSchema = z
  .string()
  .or(z.unknown())
  .transform((obj, ctx): unknown => {
    try {
      if (typeof obj === "string") {
        return JSON.parse(obj);
      } else {
        return obj;
      }
    } catch (_e) {
      ctx.addIssue({ code: "custom", message: "Invalid JSON" });
      return z.NEVER;
    }
  });
