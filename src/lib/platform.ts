import { cookies } from "next/headers";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSession, type SessionUser } from "@/lib/auth";
import { id } from "@/lib/utils";
import { decryptSecret } from "@/lib/secrets";

export const DEFAULT_TENANT_ID = "tenant_aurelia";
export const WORKSPACE_COOKIE = "active_workspace";

export function getTenantBySlug(slug: string) {
  return db.select().from(schema.tenants).where(eq(schema.tenants.slug, slug.toLowerCase())).get() ?? null;
}

export function getTenantById(tenantId: string) {
  return db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).get() ?? null;
}

export function getTenantByHost(hostname: string) {
  const host = hostname.toLowerCase().split(":")[0].replace(/^www\./, "");
  const domain = db.select().from(schema.storeDomains).where(and(eq(schema.storeDomains.hostname, host), eq(schema.storeDomains.status, "verified"))).get();
  if (domain) return getTenantById(domain.tenantId);
  // Useful for a platform deployment such as store-slug.aurelia.app.
  const parts = host.split(".");
  if (parts.length > 2 && parts[parts.length - 2] === "aurelia") return getTenantBySlug(parts[0]);
  return null;
}

export function getTenantDomain(tenantId: string) {
  return db.select().from(schema.storeDomains).where(eq(schema.storeDomains.tenantId, tenantId)).orderBy(desc(schema.storeDomains.createdAt)).get() ?? null;
}

export function getTenantIntegration(tenantId: string, provider: string) {
  return db.select().from(schema.tenantIntegrations).where(and(eq(schema.tenantIntegrations.tenantId, tenantId), eq(schema.tenantIntegrations.provider, provider))).get() ?? null;
}

export function ensureDefaultMembership(userId: string) {
  const existing = db.select().from(schema.tenantMembers).where(and(eq(schema.tenantMembers.tenantId, DEFAULT_TENANT_ID), eq(schema.tenantMembers.userId, userId))).get();
  if (existing) return existing;
  const member = { id: id("mem_"), tenantId: DEFAULT_TENANT_ID, userId, role: "owner" as const };
  db.insert(schema.tenantMembers).values(member).onConflictDoNothing().run();
  return db.select().from(schema.tenantMembers).where(and(eq(schema.tenantMembers.tenantId, DEFAULT_TENANT_ID), eq(schema.tenantMembers.userId, userId))).get()!;
}

export function ensureMembership(userId: string, tenantId: string, role: schema.TenantMember["role"] = "owner") {
  const existing = db.select().from(schema.tenantMembers).where(and(eq(schema.tenantMembers.tenantId, tenantId), eq(schema.tenantMembers.userId, userId))).get();
  if (existing) return existing;
  const member = { id: id("mem_"), tenantId, userId, role };
  db.insert(schema.tenantMembers).values(member).onConflictDoNothing().run();
  return db.select().from(schema.tenantMembers).where(and(eq(schema.tenantMembers.tenantId, tenantId), eq(schema.tenantMembers.userId, userId))).get()!;
}

export function listWorkspacesForUser(userId: string) {
  return db
    .select({ tenant: schema.tenants, member: schema.tenantMembers })
    .from(schema.tenantMembers)
    .innerJoin(schema.tenants, eq(schema.tenants.id, schema.tenantMembers.tenantId))
    .where(eq(schema.tenantMembers.userId, userId))
    .orderBy(asc(schema.tenants.createdAt))
    .all();
}

export async function getCurrentUserWorkspaces() {
  const session = await getSession();
  if (!session || session.role !== "admin") return { session, workspaces: [] as ReturnType<typeof listWorkspacesForUser> };
  let workspaces = listWorkspacesForUser(session.id);
  if (!workspaces.length) {
    ensureDefaultMembership(session.id);
    workspaces = listWorkspacesForUser(session.id);
  }
  return { session, workspaces: workspaces.slice(0, 1) };
}

export async function requireWorkspaceAccess(tenantId: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") throw new Error("UNAUTHORIZED");
  let member = db.select().from(schema.tenantMembers).where(and(eq(schema.tenantMembers.tenantId, tenantId), eq(schema.tenantMembers.userId, session.id))).get();
  if (!member && tenantId === DEFAULT_TENANT_ID) member = ensureDefaultMembership(session.id);
  if (!member) member = ensureMembership(session.id, tenantId);
  const tenant = getTenantById(tenantId);
  if (!tenant) throw new Error("WORKSPACE_NOT_FOUND");
  return { session, tenant, member };
}

export async function getCurrentWorkspace() {
  const { session, workspaces } = await getCurrentUserWorkspaces();
  if (!session || !workspaces.length) return { session, tenant: null, member: null };
  const selected = (await cookies()).get(WORKSPACE_COOKIE)?.value;
  const current = workspaces.find((w) => w.tenant.id === selected) ?? workspaces[0];
  return current ? { session, tenant: current.tenant, member: current.member } : { session, tenant: null, member: null };
}

export function workspaceStats(tenantId: string) {
  // The existing Aurelia demo is the legacy workspace. New workspaces intentionally start empty;
  // their Firestore-backed catalog will be wired in once the connection is verified.
  if (tenantId !== DEFAULT_TENANT_ID) return { products: 0, orders: 0, customers: 0, revenue: 0 };
  const products = db.select({ n: sql<number>`count(*)` }).from(schema.products).get()?.n ?? 0;
  const orders = db.select({ n: sql<number>`count(*)` }).from(schema.orders).get()?.n ?? 0;
  const customers = db.select({ n: sql<number>`count(*)` }).from(schema.users).where(eq(schema.users.role, "customer")).get()?.n ?? 0;
  const revenue = db.select({ n: sql<number>`coalesce(sum(total), 0)` }).from(schema.orders).where(sql`payment_status in ('paid','cod')`).get()?.n ?? 0;
  return { products, orders, customers, revenue };
}

export function workspaceSetup(tenantId: string) {
  const firestore = getTenantIntegration(tenantId, "firestore");
  const domain = getTenantDomain(tenantId);
  let firestoreAuthMode: "oauth" | "service_account" = "service_account";
  let firestoreProjectId = "";
  try {
    const encrypted = firestore?.config?.encrypted;
    if (encrypted) {
      const config = JSON.parse(decryptSecret(encrypted)) as { authMode?: string; projectId?: string };
      firestoreAuthMode = config.authMode === "oauth" ? "oauth" : "service_account";
      firestoreProjectId = config.projectId ?? "";
    }
  } catch { /* an invalid credential is reported by the connection status */ }
  return {
    firestoreConnected: !!firestore?.enabled && firestore.lastTestOk === true,
    firestoreTested: firestore?.lastTestOk === true,
    firestoreMessage: firestore?.lastTestMessage ?? null,
    firestoreAuthMode,
    firestoreProjectId,
    domain,
    brandReady: !!getTenantById(tenantId)?.name,
  };
}

export type WorkspaceWithMember = ReturnType<typeof listWorkspacesForUser>[number];
export type WorkspaceSession = { session: SessionUser; tenant: schema.Tenant; member: schema.TenantMember };
