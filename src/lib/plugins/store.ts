import crypto from "node:crypto";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { decryptSecret, encryptSecret } from "@/lib/secrets";
import { PLUGINS, pluginById, type PluginDef } from "./registry";

export type PluginState = { id: string; enabled: boolean; config: Record<string, string>; lastTestAt: string | null; lastTestOk: boolean | null; lastTestMessage: string | null; lastTestConfigHash: string | null };

const ALWAYS_SECRET_KEYS = new Set(["oauthAccessToken", "oauthRefreshToken", "clientSecret", "accessToken", "refreshToken", "privateKey", "secretKey", "secretAccessKey", "keySecret", "webhookSecret", "webhookToken", "password", "pass", "apiToken"]);

export function isPluginSecretKey(def: PluginDef, key: string) {
  return ALWAYS_SECRET_KEYS.has(key) || def.fields.some((f) => f.key === key && (f.type === "password" || f.key === "privateKey"));
}

function decryptConfig(def: PluginDef, config: Record<string, string>) {
  return Object.fromEntries(Object.entries(config).map(([key, value]) => {
    if (!isPluginSecretKey(def, key) || typeof value !== "string") return [key, value];
    try { return [key, decryptSecret(value)]; } catch { return [key, value]; }
  }));
}

function encryptConfig(def: PluginDef, config: Record<string, string>) {
  return Object.fromEntries(Object.entries(config).map(([key, value]) => [key, isPluginSecretKey(def, key) && typeof value === "string" && value && !value.startsWith("enc:v1:") ? encryptSecret(value) : value]));
}

function emptyState(id: string): PluginState {
  return { id, enabled: false, config: {}, lastTestAt: null, lastTestOk: null, lastTestMessage: null, lastTestConfigHash: null };
}

export function pluginConfigHash(config: Record<string, string>) {
  const normalized = Object.fromEntries(Object.entries(config).sort(([a], [b]) => a.localeCompare(b)));
  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

export function mergedPluginConfig(id: string, patch?: Record<string, string>) {
  const def = pluginById(id);
  if (!def) throw new Error("Unknown plugin");
  const current = getPluginState(id);
  const next = { ...current.config, ...(patch ?? {}) };
  // The browser receives blank values for secrets that already exist.
  for (const f of def.fields) if ((f.type === "password" || f.key === "privateKey") && patch && patch[f.key] === "") next[f.key] = current.config[f.key] ?? "";
  return next;
}

export function getPluginState(id: string): PluginState {
  const def = pluginById(id);
  if (!def) return emptyState(id);
  const row = db.select().from(schema.plugins).where(eq(schema.plugins.id, id)).get();
  if (!row) return emptyState(id);
  const config = decryptConfig(def, row.config ?? {});
  // Migrate older installations that stored plugin secrets as plain JSON. The
  // decrypted values stay server-side; only the encrypted representation is persisted.
  const rawConfig = row.config ?? {};
  const needsMigration = Object.entries(rawConfig).some(([key, value]) => isPluginSecretKey(def, key) && typeof value === "string" && !!value && !value.startsWith("enc:v1:"));
  if (needsMigration) db.update(schema.plugins).set({ config: encryptConfig(def, config) }).where(eq(schema.plugins.id, id)).run();
  return { ...row, config, lastTestConfigHash: row.lastTestConfigHash ?? null };
}

export function getAllPluginStates() {
  return PLUGINS.map((def) => ({ def, state: getPluginState(def.id) }));
}

export function isEnabled(id: string) {
  return getPluginState(id).enabled;
}

export function savePlugin(id: string, patch: { enabled?: boolean; config?: Record<string, string>; remove?: string[] }) {
  const def = pluginById(id);
  if (!def) throw new Error("Unknown plugin");
  const current = getPluginState(id);
  const next = { enabled: patch.enabled ?? current.enabled, config: mergedPluginConfig(id, patch.config) };
  for (const key of patch.remove ?? []) delete next.config[key];
  if (next.enabled) {
    const bypass = new Set(def.oauth?.bypassRequired ?? []);
    const missing = def.fields.filter((f) => f.required && !next.config[f.key] && !(next.config.authMode === "oauth" && bypass.has(f.key)));
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
    .values({ id, enabled: next.enabled, config: encryptConfig(def, next.config) })
    .onConflictDoUpdate({ target: schema.plugins.id, set: { enabled: next.enabled, config: encryptConfig(def, next.config) } })
    .run();
  return getPluginState(id);
}

export function recordTest(id: string, ok: boolean, message: string, configHash?: string) {
  db.insert(schema.plugins)
    .values({ id, enabled: false, config: {}, lastTestAt: new Date().toISOString(), lastTestOk: ok, lastTestMessage: message, lastTestConfigHash: configHash ?? null })
    .onConflictDoUpdate({ target: schema.plugins.id, set: { lastTestAt: new Date().toISOString(), lastTestOk: ok, lastTestMessage: message, lastTestConfigHash: configHash ?? null } })
    .run();
}

export function activePaymentGateway(): "razorpay" | "cashfree" | null {
  if (isEnabled("razorpay")) return "razorpay";
  if (isEnabled("cashfree")) return "cashfree";
  return null;
}
