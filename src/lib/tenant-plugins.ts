import { decryptSecret } from "@/lib/secrets";
import { getTenantIntegration } from "@/lib/platform";
import { isPluginSecretKey } from "@/lib/plugins/store";
import { pluginById, PLUGINS, type PluginDef } from "@/lib/plugins/registry";

export type TenantPluginState = {
  id: string;
  enabled: boolean;
  config: Record<string, string>;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
  lastTestMessage: string | null;
  lastTestConfigHash: string | null;
};

function decryptConfig(def: PluginDef, raw: Record<string, string>) {
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => {
    if (!isPluginSecretKey(def, key) || typeof value !== "string") return [key, value];
    try { return [key, decryptSecret(value)]; } catch { return [key, value]; }
  }));
}

export function tenantPluginDefinition(provider: string) {
  const def = pluginById(provider);
  // Firestore has a richer tenant-specific settings surface and must not be
  // edited through the generic plugin editor.
  return def && def.id !== "firestore" ? def : null;
}

export function getTenantPluginState(tenantId: string, provider: string): TenantPluginState {
  const def = tenantPluginDefinition(provider);
  if (!def) return { id: provider, enabled: false, config: {}, lastTestAt: null, lastTestOk: null, lastTestMessage: null, lastTestConfigHash: null };
  const row = getTenantIntegration(tenantId, provider);
  if (!row) return { id: provider, enabled: false, config: {}, lastTestAt: null, lastTestOk: null, lastTestMessage: null, lastTestConfigHash: null };
  let raw: Record<string, string> = {};
  try {
    raw = row.config?.encrypted ? JSON.parse(decryptSecret(row.config.encrypted)) as Record<string, string> : {};
  } catch {
    raw = {};
  }
  return { id: provider, enabled: row.enabled, config: decryptConfig(def, raw), lastTestAt: row.lastTestAt ?? null, lastTestOk: row.lastTestOk ?? null, lastTestMessage: row.lastTestMessage ?? null, lastTestConfigHash: row.lastTestConfigHash ?? null };
}

export function maskedTenantPluginConfig(tenantId: string, provider: string) {
  const def = tenantPluginDefinition(provider);
  const state = getTenantPluginState(tenantId, provider);
  if (!def) return { config: {}, hasSecret: {} as Record<string, boolean> };
  const hasSecret = Object.fromEntries(def.fields.filter((field) => isPluginSecretKey(def, field.key)).map((field) => [field.key, !!state.config[field.key]]));
  const config = Object.fromEntries(Object.entries(state.config).map(([key, value]) => [key, isPluginSecretKey(def, key) ? "" : value]));
  return { config, hasSecret };
}

export function tenantPluginDefs() {
  return PLUGINS.filter((def) => def.id !== "firestore");
}
