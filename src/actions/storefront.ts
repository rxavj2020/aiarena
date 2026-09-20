"use server";
import { db, schema } from "@/lib/db";
import { id } from "@/lib/utils";
import { getSession } from "@/lib/auth";
import { sendContactMessage } from "@/lib/plugins/mail";
import { z } from "zod";

export async function subscribeAction(_: { ok?: boolean; error?: string } | undefined, fd: FormData) {
  const email = String(fd.get("email") ?? "").toLowerCase().trim();
  if (!z.string().email().safeParse(email).success) return { error: "Enter a valid email" };
  db.insert(schema.subscribers).values({ id: id("sub_"), email }).onConflictDoNothing().run();
  return { ok: true };
}

export async function contactAction(_: { ok?: boolean; error?: string } | undefined, fd: FormData) {
  const p = z.object({ name: z.string().min(2), email: z.string().email(), message: z.string().min(10, "Message is too short") }).safeParse({ name: fd.get("name"), email: fd.get("email"), message: fd.get("message") });
  if (!p.success) return { error: p.error.issues[0].message };
  await sendContactMessage(p.data);
  return { ok: true };
}

export async function reviewAction(_: { ok?: boolean; error?: string } | undefined, fd: FormData) {
  const s = await getSession();
  const p = z.object({ productId: z.string(), rating: z.coerce.number().min(1).max(5), title: z.string().optional(), body: z.string().min(5, "Review is too short"), authorName: z.string().min(2) }).safeParse({
    productId: fd.get("productId"), rating: fd.get("rating"), title: fd.get("title"), body: fd.get("body"), authorName: fd.get("authorName") || s?.name,
  });
  if (!p.success) return { error: p.error.issues[0].message };
  db.insert(schema.reviews).values({ id: id("rev_"), ...p.data, userId: s?.id, approved: false }).run();
  return { ok: true };
}
