"use server";

import { scryptSync, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";

import { createToken } from "@/server/auth";
import { createDbClient } from "@demo/db";
import { orgMemberTable, userTable } from "@demo/db/schema";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL required");
const { db } = createDbClient(databaseUrl, {
  min: 1,
  max: 2,
  allowExitOnIdle: true,
});

function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(":");
  if (!salt || !storedHash) return false;
  const derivedHash = scryptSync(password, salt, 64).toString("hex");
  const storedBuffer = Buffer.from(storedHash, "hex");
  const derivedBuffer = Buffer.from(derivedHash, "hex");
  if (storedBuffer.length !== derivedBuffer.length) return false;
  return timingSafeEqual(storedBuffer, derivedBuffer);
}

export async function login(
  _previousState: string | null,
  formData: FormData,
): Promise<string | null> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return "Email and password are required.";
  }

  const user = await db.query.userTable.findFirst({
    where: eq(userTable.email, email),
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return "Invalid email or password.";
  }

  const orgMember = await db.query.orgMemberTable.findFirst({
    where: eq(orgMemberTable.userId, user.id),
  });

  if (!orgMember) {
    return "No organization found for this user.";
  }

  const token = await createToken({
    userId: user.id,
    orgId: orgMember.orgId,
  });

  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  redirect("/");
}
