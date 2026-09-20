import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { PLUGINS, pluginById } from "./registry";

export type PluginState = { id: string; enabled: boolean; config: Record<string, string>; lastTestAt: string | null; lastTestOk: boolean | null; lastTestMessage: string | null };

export function getPluginState(id: string): PluginState {
  const row = db.select().from(schema.plugins).where(eq(schema.plugins.id, id)).get();
  return row ? { ...row, config: row.config ?? {} } : { id, enabled: false, config: {}, lastTestAt: null, lastTestOk: null, lastTestMessage: null };
}

export function getAllPluginStates() {
  const rows = db.select().from(schema.plugins).all();
  const map = new Map(rows.map((r) => [r.id, r]));
  return PLUGINS.map((def) => ({ def, state: (map.get(def.id) as PluginState | undefined) ?? getPluginState(def.id) }));
}

export function isEnabled(id: string) {
  return getPluginState(id).enabled;
}

export function savePlugin(id: string, patch: { enabled?: boolean; config?: Record<string, string> }) {
  const def = pluginById(id);
  if (!def) throw new Error("Unknown plugin");
  const current = getPluginState(id);
  const next = { enabled: patch.enabled ?? current.enabled, config: { ...current.config, ...(patch.config ?? {}) } };
  // Empty password fields mean "keep existing"
  for (const f of def.fields) if (f.type === "password" && patch.config && patch.config[f.key] === "") next.config[f.key] = current.config[f.key] ?? "";
  if (next.enabled) {
    const missing = def.fields.filter((f) => f.required && !next.config[f.key]);
    if (missing.length) throw new Error(`Missing required fields: ${missing.map((m) => m.label).join(", ")}`);
    if (def.exclusiveGroup) {
      for (const other of PLUGINS) {
        if (other.id !== id && other.exclusiveGroup === def.exclusiveGroup) {
          db.update(schema.plugins).set({ enabled: false }).where(eq(schema.plugins.id, other.id)).run();
        }
      }
    }
  }
  db.insert(schema.plugins)
    .values({ id, enabled: next.enabled, config: next.config })
    .onConflictDoUpdate({ target: schema.plugins.id, set: { enabled: next.enabled, config: next.config } })
    .run();
  return getPluginState(id);
}

export function recordTest(id: string, ok: boolean, message: string) {
  db.insert(schema.plugins)
    .values({ id, enabled: false, config: {}, lastTestAt: new Date().toISOString(), lastTestOk: ok, lastTestMessage: message })
    .onConflictDoUpdate({ target: schema.plugins.id, set: { lastTestAt: new Date().toISOString(), lastTestOk: ok, lastTestMessage: message } })
    .run();
}

export function activePaymentGateway(): "razorpay" | "cashfree" | null {
  if (isEnabled("razorpay")) return "razorpay";
  if (isEnabled("cashfree")) return "cashfree";
  return null;
}
