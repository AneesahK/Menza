import { id, timestamps } from "../utils.js";
import { organizationTable } from "./organization.js";
import { userTable } from "./user.js";
import {
  foreignKey,
  pgTable,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const orgMemberRoles = ["admin", "member"] as const;
export type OrgMemberRole = (typeof orgMemberRoles)[number];

export const orgMemberTable = pgTable(
  "org_member",
  {
    ...id,
    ...timestamps,
    userId: varchar("user_id", { length: 64 }).notNull(),
    orgId: varchar("org_id", { length: 64 }).notNull(),
    role: varchar("role", { enum: orgMemberRoles }).notNull().default("member"),
  },
  (table) => {
    return [
      foreignKey({
        columns: [table.userId],
        foreignColumns: [userTable.id],
        name: "fk__org_member__user_id",
      }),
      foreignKey({
        columns: [table.orgId],
        foreignColumns: [organizationTable.id],
        name: "fk__org_member__org_id",
      }),
      uniqueIndex("ucidx__org_member__user_id__org_id").on(
        table.userId,
        table.orgId,
      ),
    ];
  },
);
