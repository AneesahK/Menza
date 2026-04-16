import { jwtVerify, SignJWT } from "jose";

import { cookies } from "next/headers";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "change-me-to-a-random-secret";
const secretKey = new TextEncoder().encode(AUTH_SECRET);

export type Session = {
  userId: string;
  orgId: string;
};

export async function auth(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey);
    const userId = payload.userId as string | undefined;
    const orgId = payload.orgId as string | undefined;
    if (!userId || !orgId) return null;
    return { userId, orgId };
  } catch {
    return null;
  }
}

export function createToken(session: Session): Promise<string> {
  return new SignJWT({ userId: session.userId, orgId: session.orgId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("auth-token")?.value ?? null;
}
