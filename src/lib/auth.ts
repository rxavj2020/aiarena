import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { id } from "@/lib/utils";

const COOKIE = "session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me-please-32-chars-min");

export type SessionUser = { id: string; email: string; name: string; role: "customer" | "admin" };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret());
  const c = await cookies();
  c.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === "production" });
}

export async function destroySession() {
  const c = await cookies();
  c.delete(COOKIE);
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { id: payload.id as string, email: payload.email as string, name: payload.name as string, role: payload.role as "customer" | "admin" };
  } catch {
    return null;
  }
});

export async function requireAdmin() {
  const s = await getSession();
  if (!s || s.role !== "admin") throw new Error("UNAUTHORIZED");
  return s;
}

export async function requireUser() {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

export async function verifyCredentials(email: string, password: string) {
  const user = db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase().trim())).get();
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export async function registerUser(input: { email: string; password: string; name: string; role?: "customer" | "admin" }) {
  const email = input.email.toLowerCase().trim();
  const exists = db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).get();
  if (exists) throw new Error("An account with this email already exists");
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = { id: id("usr_"), email, passwordHash, name: input.name.trim(), role: input.role ?? ("customer" as const) };
  db.insert(schema.users).values(user).run();
  import("@/lib/plugins/firestore").then((m) => m.mirrorRow("users", user.id)).catch(() => {});
  return user;
}
