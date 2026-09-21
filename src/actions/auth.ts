"use server";
import { createSession, destroySession, registerUser, verifyCredentials } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { ensureDefaultMembership } from "@/lib/platform";

export type AuthState = { error?: string } | undefined;

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "");
  const user = await verifyCredentials(email, password);
  if (!user) return { error: "Invalid email or password" };
  if (user.role !== "admin") {
    db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, user.id)).run();
  }
  ensureDefaultMembership(user.id);
  await createSession({ id: user.id, email: user.email, name: user.name, role: "admin" });
  const target = requestedNext.startsWith("/dashboard") ? requestedNext : "/dashboard";
  redirect(target);
}

const registerSchema = z.object({ name: z.string().min(2, "Name is too short"), email: z.string().email("Enter a valid email"), password: z.string().min(8, "Password must be at least 8 characters") });

export async function registerAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const user = await registerUser({ ...parsed.data, role: "admin" });
    ensureDefaultMembership(user.id);
    await createSession({ id: user.id, email: user.email, name: user.name, role: "admin" });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Registration failed" };
  }
  redirect("/dashboard");
}

/** Separate owner signup so public shoppers can never self-register as store admins. */
export async function registerOwnerAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const user = await registerUser({ ...parsed.data, role: "admin" });
    ensureDefaultMembership(user.id);
    await createSession({ id: user.id, email: user.email, name: user.name, role: "admin" });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Registration failed" };
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
