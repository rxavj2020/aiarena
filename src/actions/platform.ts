"use server";

import { cookies } from "next/headers";
import dns from "node:dns/promises";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureMembership, getTenantById, getTenantBySlug, requireWorkspaceAccess, WORKSPACE_COOKIE } from "@/lib/platform";
import { id, slugify } from "@/lib/utils";
import { encryptSecret } from "@/lib/secrets";
import { testFirestore } from "@/lib/plugins/firestore";

export type PlatformResult = { ok: true; message?: string; slug?: string; tenantId?: string } | { ok: false; error: string };

const wrap = async (fn: () => Promise<PlatformResult> | PlatformResult): Promise<PlatformResult> => {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") throw new Error("UNAUTHORIZED");
    return await fn();
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
};

const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Give your store a name"),
  slug: z.string().trim().min(2, "Choose a public URL").max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  plan: z.enum(["starter", "growth", "scale"]),
  tagline: z.string().trim().max(120).default("Your store, your way"),
});

const brandSchema = z.object({
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(120),
  logoUrl: z.string().trim().max(2000).optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Use a six-digit hex colour"),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Use a six-digit hex colour"),
});

const firestoreSchema = z.object({
  projectId: z.string().trim().min(1, "Project ID is required"),
  databaseId: z.string().trim().default("(default)"),
  clientEmail: z.string().trim().email("Use the service account client email"),
  privateKey: z.string().trim().min(80, "Paste the full private key"),
  collectionPrefix: z.string().trim().regex(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, hyphens or underscores").default("store_"),
});

export type FirestoreInput = z.infer<typeof firestoreSchema>;

export async function createWorkspace(input: { name: string; slug: string; plan: schema.Tenant["plan"]; tagline?: string }): Promise<PlatformResult> {
  return wrap(async () => {
    const parsed = workspaceSchema.safeParse({ ...input, slug: slugify(input.slug) });
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    const existing = getTenantBySlug(parsed.data.slug);
    if (existing) return { ok: false, error: "That public URL is already taken" };
    const session = await getSession();
    if (!session) throw new Error("UNAUTHORIZED");
    const tenantId = id("tenant_");
    db.insert(schema.tenants).values({ id: tenantId, slug: parsed.data.slug, name: parsed.data.name, tagline: parsed.data.tagline, plan: parsed.data.plan, status: "setup" }).run();
    ensureMembership(session.id, tenantId, "owner");
    db.insert(schema.storeDomains).values({ id: id("dom_"), tenantId, hostname: `${parsed.data.slug}.aurelia.app`, kind: "platform", status: "verified", verificationToken: "platform-managed" }).run();
    revalidatePath("/platform");
    return { ok: true, message: "Workspace created", slug: parsed.data.slug, tenantId };
  });
}

export async function saveWorkspaceBranding(tenantId: string, input: { name: string; tagline: string; logoUrl?: string; primaryColor: string; accentColor: string }): Promise<PlatformResult> {
  return wrap(async () => {
    await requireWorkspaceAccess(tenantId);
    const parsed = brandSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    db.update(schema.tenants).set({ ...parsed.data, logoUrl: parsed.data.logoUrl || null, updatedAt: new Date().toISOString() }).where(eq(schema.tenants.id, tenantId)).run();
    revalidatePath("/platform", "layout");
    revalidatePath(`/site/${getTenantById(tenantId)?.slug ?? ""}`);
    return { ok: true, message: "Brand settings saved" };
  });
}

export async function connectWorkspaceFirestore(tenantId: string, input: FirestoreInput): Promise<PlatformResult> {
  return wrap(async () => {
    const { tenant } = await requireWorkspaceAccess(tenantId);
    const parsed = firestoreSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
    // Always namespace collections with the workspace slug. A user-selected prefix alone
    // could otherwise let two workspaces share collections in the same Firebase project.
    const config: Record<string, string> = {
      ...parsed.data,
      databaseId: parsed.data.databaseId || "(default)",
      collectionPrefix: `${parsed.data.collectionPrefix}${tenant.slug}_`,
    };
    const message = await testFirestore(config);
    const existing = db.select().from(schema.tenantIntegrations).where(and(eq(schema.tenantIntegrations.tenantId, tenantId), eq(schema.tenantIntegrations.provider, "firestore"))).get();
    const row = {
      tenantId,
      provider: "firestore",
      enabled: true,
      // Credentials are encrypted at rest and never sent back by the platform UI.
      config: { encrypted: encryptSecret(JSON.stringify(config)) },
      lastTestAt: new Date().toISOString(),
      lastTestOk: true,
      lastTestMessage: message,
    };
    if (existing) db.update(schema.tenantIntegrations).set(row).where(eq(schema.tenantIntegrations.id, existing.id)).run();
    else db.insert(schema.tenantIntegrations).values({ id: id("int_"), ...row }).run();
    revalidatePath(`/platform/stores/${getTenantById(tenantId)?.slug ?? ""}`);
    revalidatePath("/platform");
    return { ok: true, message: "Firestore connected — your data is ready for sync" };
  });
}

export async function launchWorkspace(tenantId: string): Promise<PlatformResult> {
  return wrap(async () => {
    await requireWorkspaceAccess(tenantId);
    const integration = db.select().from(schema.tenantIntegrations).where(and(eq(schema.tenantIntegrations.tenantId, tenantId), eq(schema.tenantIntegrations.provider, "firestore"))).get();
    if (!integration?.enabled || integration.lastTestOk !== true) return { ok: false, error: "Connect and test Firestore before launching your store" };
    db.update(schema.tenants).set({ status: "active", updatedAt: new Date().toISOString() }).where(eq(schema.tenants.id, tenantId)).run();
    revalidatePath("/platform", "layout");
    return { ok: true, message: "Store launched" };
  });
}

export async function connectWorkspaceDomain(tenantId: string, hostname: string): Promise<PlatformResult> {
  return wrap(async () => {
    const { tenant } = await requireWorkspaceAccess(tenantId);
    const clean = hostname.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
    if (!clean || !clean.includes(".") || clean.includes(" ")) return { ok: false, error: "Enter a valid domain such as shop.example.com" };
    if (clean === "aurelia.app" || clean.endsWith(".aurelia.app")) return { ok: false, error: "Use a domain you own; Aurelia URLs are managed automatically" };
    const existing = db.select().from(schema.storeDomains).where(eq(schema.storeDomains.hostname, clean)).get();
    if (existing && existing.tenantId !== tenantId) return { ok: false, error: "That domain is already linked to another store" };
    const currentCustom = db.select().from(schema.storeDomains).where(and(eq(schema.storeDomains.tenantId, tenantId), eq(schema.storeDomains.kind, "custom"))).get();
    if (existing) {
      if (existing.kind !== "custom") return { ok: false, error: "That hostname is managed by Aurelia" };
      db.update(schema.storeDomains).set({ status: "pending" }).where(eq(schema.storeDomains.id, existing.id)).run();
    } else if (currentCustom) {
      db.update(schema.storeDomains).set({ hostname: clean, status: "pending", verificationToken: `aurelia-site=${id("verify_")}` }).where(eq(schema.storeDomains.id, currentCustom.id)).run();
    } else {
      db.insert(schema.storeDomains).values({ id: id("dom_"), tenantId, hostname: clean, kind: "custom", status: "pending", verificationToken: `aurelia-site=${id("verify_")}` }).run();
    }
    revalidatePath(`/platform/stores/${tenant.slug}`);
    return { ok: true, message: "Domain saved — add the DNS record shown below to verify it" };
  });
}

export async function verifyWorkspaceDomain(tenantId: string): Promise<PlatformResult> {
  return wrap(async () => {
    await requireWorkspaceAccess(tenantId);
    const domain = db.select().from(schema.storeDomains).where(and(eq(schema.storeDomains.tenantId, tenantId), eq(schema.storeDomains.kind, "custom"))).get();
    if (!domain) return { ok: false, error: "Save a custom domain first" };
    let records: string[] = [];
    try { records = await dns.resolveCname(domain.hostname); } catch { return { ok: false, error: "No CNAME record found yet. DNS changes can take a few minutes." }; }
    const pointsToAurelia = records.some((record) => record.replace(/\.$/, "").toLowerCase() === "aurelia.app" || record.toLowerCase().endsWith(".aurelia.app"));
    if (!pointsToAurelia) return { ok: false, error: `CNAME currently points to ${records.join(", ") || "an unknown target"}. Point it to aurelia.app.` };
    db.update(schema.storeDomains).set({ status: "verified" }).where(eq(schema.storeDomains.id, domain.id)).run();
    revalidatePath(`/platform/stores/${getTenantById(tenantId)?.slug ?? ""}`);
    return { ok: true, message: "Domain verified — your public site can now serve it" };
  });
}

export async function selectWorkspace(tenantId: string, next = "/admin") {
  await requireWorkspaceAccess(tenantId);
  (await cookies()).set(WORKSPACE_COOKIE, tenantId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === "production" });
  redirect(next);
}
