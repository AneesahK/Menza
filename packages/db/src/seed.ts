import { randomBytes, scryptSync } from "node:crypto";

import { eq } from "drizzle-orm";

import { createDbClient } from "./db.js";
import { orgMemberTable } from "./schema/org-member.js";
import { organizationTable } from "./schema/organization.js";
import { userTable } from "./schema/user.js";
import { createID } from "./utils.js";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const { db, pool } = createDbClient(DATABASE_URL, { allowExitOnIdle: true });

async function seed() {
  console.log("Seeding database...");

  const passwordHash = hashPassword("password123");

  const existingUser = await db.query.userTable.findFirst({
    where: eq(userTable.email, "demo@menza.ai"),
  });

  const userId = existingUser?.id ?? createID("user");

  if (!existingUser) {
    await db.insert(userTable).values({
      id: userId,
      email: "demo@menza.ai",
      passwordHash,
      name: "Demo User",
    });
    console.log(`  Created user: demo@menza.ai (${userId})`);
  } else {
    console.log(`  User already exists: demo@menza.ai (${userId})`);
  }

  const existingMember = await db.query.orgMemberTable.findFirst({
    where: eq(orgMemberTable.userId, userId),
  });

  const orgId = existingMember?.orgId ?? createID("org");

  if (!existingMember) {
    await db.insert(organizationTable).values({
      id: orgId,
      name: "Acme Commerce",
    });
    console.log(`  Created org: Acme Commerce (${orgId})`);

    const orgMemberId = createID("orgMember");
    await db.insert(orgMemberTable).values({
      id: orgMemberId,
      userId,
      orgId,
      role: "admin",
    });
    console.log(`  Created org_member: admin role`);
  } else {
    console.log(`  Org membership already exists (${orgId})`);
  }

  console.log("\nSeed complete!");
  console.log("Login with: demo@menza.ai / password123");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
