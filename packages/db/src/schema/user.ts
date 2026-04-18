import { id, timestamps } from "../utils.js";
import { boolean, pgTable, text, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const userTable = pgTable(
  "user",
  {
    ...id,
    ...timestamps,
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    instructions: text("instructions").notNull().default(""),
  },
  (table) => {
    return [
      uniqueIndex("uidx__user__email").on(table.email),
    ];
  },
);
