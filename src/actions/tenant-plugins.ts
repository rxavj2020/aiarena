"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireWorkspaceAccess } from "@/lib/platform";
import { id } from "@/lib/utils";
import { encryptSecret } from "@/lib/secrets";
import { isPluginSecretKey, pluginConfigHash } from "@/lib/plugins/store";
import { pluginById } from "@/lib/plugins/registry";
import { testRazorpay, testCashfree, testCloudflare } from "@/lib/plugins/payments";
import { testR2 } from "@/lib/plugins/storage";
import { testShiprocket } from "@/lib/plugins/shiprocket";
import { makeTransport, sendMail } from "@/lib/plugins/mail";
import { getTenantPluginState, tenantPluginDefinition } from "@/lib/tenant-plugins";

export type TenantPluginResult = { ok: true; message?: string } | { ok: false; error: string };

function inputSchema() {
  return z.record(z.string(), z.string());
}

function validateConfig(provider: string, config: Record<string, string>, allowOauthBypass = false) {
  const def = tenantPluginDefinition(provider);
  if (!def) throw new Error("Unknown store integration");
  const bypass = new Set(allowOauthBypass ? (def.oauth?.bypassRequired ?? []) : []);
  const missing = def.fields.filter((field) => field.required && !config[field.key] && !bypass.has(field.key));
  if (missing.length) throw new Error(`Missing required fields: ${missing.map((field) => field.label).join(", ")}`);
  return def;
}

function saveRow(tenantId: string, provider: string, config: Record<string, string>, patch: { enabled: boolean; lastTestAt?: string | null; lastTestOk?: boolean | null; lastTestMessage?: string | null; lastTestConfigHash?: string | null }) {
  const def = tenantPluginDefinition(provider);
  if (!def) throw new Error("Unknown store integration");
  const existing = db.select().from(schema.tenantIntegrations).where(and(eq(schema.tenantIntegrations.tenantId, tenantId), eq(schema.tenantIntegrations.provider, provider))).get();
  const row = {
    tenantId,
    provider,
    enabled: patch.enabled,
    config: { encrypted: encryptSecret(JSON.stringify(Object.fromEntries(Object.entries(config).map(([key, value]) => [key, isPluginSecretKey(def, key) && value ? encryptSecret(value) : value])))) },
    lastTestAt: patch.lastTestAt ?? existing?.lastTestAt ?? null,
    lastTestOk: patch.lastTestOk ?? existing?.lastTestOk ?? null,
    lastTestMessage: patch.lastTestMessage ?? existing?.lastTestMessage ?? null,
    lastTestConfigHash: patch.lastTestConfigHash ?? existing?.lastTestConfigHash ?? null,
  };
  if (existing) db.update(schema.tenantIntegrations).set(row).where(eq(schema.tenantIntegrations.id, existing.id)).run();
  else db.insert(schema.tenantIntegrations).values({ id: id("int_"), ...row }).run();
}

async function testConnection(provider: string, config: Record<string, string>) {
  if (provider === "razorpay") return testRazorpay(config);
  if (provider === "cashfree") return testCashfree(config);
  if (provider === "r2") return testR2(config);
  if (provider === "cloudflare") return testCloudflare(config);
  if (provider === "shiprocket") return testShiprocket(config);
  if (provider === "smtp") {
    await makeTransport(config).verify();
    const to = config.adminEmail || config.fromEmail || config.user;
    if (to) {
      const result = await sendMail({ to, subject: "Test email from your store", html: "<p>Your store email integration is configured correctly.</p>", config });
      if (!result.ok) throw new Error(result.error);
      return `SMTP verified and test email sent to ${to}`;
    }
    return "SMTP connection verified";
  }
  // WhatsApp and analytics are configuration-only browser integrations; their
  // required values are validated above and no provider secret is fabricated.
  return "Configuration validated";
}

export async function testStorePlugin(tenantId: string, provider: string, input: unknown): Promise<TenantPluginResult> {
  try {
    await requireWorkspaceAccess(tenantId);
    const def = tenantPluginDefinition(provider);
    if (!def || !pluginById(provider)) throw new Error("Unknown store integration");
    const parsed = inputSchema().safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid integration values" };
    const existing = getTenantPluginState(tenantId, provider);
    const config = { ...existing.config };
    for (const field of def.fields) {
      const value = parsed.data[field.key];
      if (value !== undefined && (value !== "" || !isPluginSecretKey(def, field.key))) config[field.key] = value;
    }
    validateConfig(provider, config);
    const message = await testConnection(provider, config);
    saveRow(tenantId, provider, config, { enabled: existing.enabled, lastTestAt: new Date().toISOString(), lastTestOk: true, lastTestMessage: message, lastTestConfigHash: pluginConfigHash(config) });
    revalidatePath("/admin");
    revalidatePath(`/admin/plugins/${provider}`);
    return { ok: true, message };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    try {
      const def = tenantPluginDefinition(provider);
      const existing = getTenantPluginState(tenantId, provider);
      if (def) saveRow(tenantId, provider, existing.config, { enabled: false, lastTestAt: new Date().toISOString(), lastTestOk: false, lastTestMessage: message, lastTestConfigHash: null });
    } catch { /* preserve the original provider error */ }
    return { ok: false, error: message };
  }
}

export async function updateStorePlugin(tenantId: string, provider: string, input: { enabled?: boolean; config?: unknown }): Promise<TenantPluginResult> {
  try {
    await requireWorkspaceAccess(tenantId);
    const def = tenantPluginDefinition(provider);
    if (!def || !pluginById(provider)) throw new Error("Unknown store integration");
    const parsed = inputSchema().safeParse(input.config ?? {});
    if (!parsed.success) return { ok: false, error: "Invalid integration values" };
    const existing = getTenantPluginState(tenantId, provider);
    const config = { ...existing.config };
    for (const field of def.fields) {
      const value = parsed.data[field.key];
      if (value !== undefined && (value !== "" || !isPluginSecretKey(def, field.key))) config[field.key] = value;
    }
    const enabled = input.enabled ?? existing.enabled;
    if (enabled) {
      validateConfig(provider, config);
      if (def.canTest && (existing.lastTestOk !== true || existing.lastTestConfigHash !== pluginConfigHash(config))) {
        throw new Error("Run a successful connection test with the current values before enabling this integration");
      }
      if (def.exclusiveGroup) {
        for (const other of ["razorpay", "cashfree"]) {
          if (other !== provider && pluginById(other)?.exclusiveGroup === def.exclusiveGroup) {
            db.update(schema.tenantIntegrations).set({ enabled: false }).where(and(eq(schema.tenantIntegrations.tenantId, tenantId), eq(schema.tenantIntegrations.provider, other))).run();
          }
        }
      }
    }
    saveRow(tenantId, provider, config, { enabled });
    revalidatePath("/admin");
    revalidatePath(`/admin/plugins/${provider}`);
    return { ok: true, message: enabled ? "Integration enabled" : "Integration disabled" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
