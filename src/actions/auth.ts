"use server";
import { createSession, destroySession, registerUser, verifyCredentials } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

export type AuthState = { error?: string } | undefined;

function safeNext(value: string, fallback: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "");
  const user = await verifyCredentials(email, password);
  if (!user) return { error: "Invalid email or password" };
  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect(safeNext(requestedNext, user.role === "admin" ? "/admin" : "/account"));
}

const registerSchema = z.object({ name: z.string().min(2, "Name is too short"), email: z.string().email("Enter a valid email"), password: z.string().min(8, "Password must be at least 8 characters") });

export async function registerAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const user = await registerUser(parsed.data);
    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Registration failed" };
  }
  redirect(safeNext(String(formData.get("next") || ""), "/account"));
}

/** Separate owner signup so public shoppers can never self-register as store admins. */
export async function registerOwnerAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const user = await registerUser({ ...parsed.data, role: "admin" });
    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Registration failed" };
  }
  redirect("/platform/new");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
