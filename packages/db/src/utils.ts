import { isValid, ulid } from "ulidx";
import { z } from "zod";

import { timestamp as rawTs, varchar } from "drizzle-orm/pg-core";

const prefixes = {
  chat: "chat",
  message: "msg",
  widget: "widget",
  user: "user",
  org: "org",
  orgMember: "om",
  run: "run",
  toolCall: "tool",
} as const;

export function createID(entity: keyof typeof prefixes): string {
  return [prefixes[entity], ulid()].join("_");
}

export const customIdSchema = z
  .string()
  .max(64)
  .refine(
    (val) => {
      const split = val.split("_");
      return split.length === 2 && isValid(split[1] ?? "");
    },
    {
      message: "Invalid ID format",
    },
  );

export const ulidCol = (name: string) => {
  return varchar(name, { length: 64 });
};

export const id = {
  get id() {
    return ulidCol("id").primaryKey().notNull();
  },
};

export const timestamp = (name: string) =>
  rawTs(name, {
    precision: 3,
    withTimezone: true,
    mode: "date",
  });

export const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
};
