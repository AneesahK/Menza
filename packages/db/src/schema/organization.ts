import { id, timestamps } from "../utils.js";
import { pgTable, varchar } from "drizzle-orm/pg-core";

export const organizationTable = pgTable(
  "organization",
  {
    ...id,
    ...timestamps,
    name: varchar("name", { length: 255 }).notNull(),
  },
  (_table) => {
    return [];
  },
);
