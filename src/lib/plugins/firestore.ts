import crypto from "node:crypto";
import { getPluginState } from "./store";
import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * Firestore integration via the REST API using a service-account JWT.
 * Design: SQLite = fast local index; Firestore = durable source of truth.
 *  - mirrorRow(): write-through after each local write (fire-and-forget)
 *  - fullSync(): push every table
 *  - restoreFromFirestore(): rebuild SQLite from Firestore
 */

type Cfg = Record<string, string>;
const SYNCED_TABLES = ["users", "addresses", "categories", "products", "variants", "orders", "order_items", "order_events", "coupons", "reviews", "pages", "settings", "plugins", "subscribers"] as const;
export type SyncedTable = (typeof SYNCED_TABLES)[number];
const PK: Record<string, string> = { settings: "key" };

const tokenCache = new Map<string, { token: string; exp: number }>();

function b64url(b: Buffer | string) {
  return Buffer.from(b).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function getAccessToken(c: Cfg) {
  const key = c.clientEmail;
  const cached = tokenCache.get(key);
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: c.clientEmail, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const pk = c.privateKey.replace(/\\n/g, "\n");
  const sig = crypto.createSign("RSA-SHA256").update(`${header}.${claim}`).sign(pk);
  const jwt = `${header}.${claim}.${b64url(sig)}`;
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}` });
  if (!r.ok) throw new Error(`Google auth failed: ${(await r.text()).slice(0, 200)}`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  tokenCache.set(key, { token: j.access_token, exp: Date.now() + j.expires_in * 1000 });
  return j.access_token;
}

const base = (c: Cfg) => `https://firestore.googleapis.com/v1/projects/${c.projectId}/databases/${c.databaseId || "(default)"}/documents`;
const coll = (c: Cfg, table: string) => `${c.collectionPrefix ?? "store_"}${table}`;

// ---- value encoding (Firestore typed values) ----
type FsValue = { nullValue?: null; booleanValue?: boolean; integerValue?: string; doubleValue?: number; stringValue?: string; arrayValue?: { values?: FsValue[] }; mapValue?: { fields?: Record<string, FsValue> } };
function enc(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, enc(x)])) } };
}
function dec(v: FsValue): unknown {
  if (!v) return null;
  if ("nullValue" in v) return null;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.arrayValue) return (v.arrayValue.values ?? []).map(dec);
  if (v.mapValue) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, dec(x)]));
  return null;
}

async function fsFetch(c: Cfg, path: string, init?: RequestInit) {
  const token = await getAccessToken(c);
  const r = await fetch(path.startsWith("http") ? path : `${base(c)}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!r.ok) throw new Error(`Firestore ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

function isActive() {
  const s = getPluginState("firestore");
  return s.enabled && s.config.projectId && s.config.privateKey ? s.config : null;
}

/** Raw row access via SQLite so we can sync generically. */
function rawRows(table: string): Record<string, unknown>[] {
  return db.all(sql.raw(`select * from "${table}"`)) as Record<string, unknown>[];
}
function normalizeRow(table: string, row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === "string" && (v.startsWith("{") || v.startsWith("["))) { try { out[k] = JSON.parse(v); continue; } catch {} }
    out[k] = v;
  }
  return out;
}

/** Write-through mirror of a single row (safe to call anywhere; never throws). */
export function mirrorRow(table: SyncedTable, id: string) {
  const c = isActive();
  if (!c) return;
  const pk = PK[table] ?? "id";
  const row = (db.all(sql.raw(`select * from "${table}" where "${pk}" = '${id.replace(/'/g, "''")}'`)) as Record<string, unknown>[])[0];
  const p = row
    ? fsFetch(c, `/${coll(c, table)}/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ fields: Object.fromEntries(Object.entries(normalizeRow(table, row)).map(([k, v]) => [k, enc(v)])) }) })
    : fsFetch(c, `/${coll(c, table)}/${encodeURIComponent(id)}`, { method: "DELETE" });
  p.catch((e) => console.error("[firestore] mirror failed", table, id, e instanceof Error ? e.message : e));
}

/** Push every row of every table using batched commits (max 500 writes per commit). */
export async function fullSync(c?: Cfg, onProgress?: (msg: string) => void) {
  const cfg = c ?? isActive();
  if (!cfg) throw new Error("Firestore plugin not configured");
  let total = 0;
  for (const table of SYNCED_TABLES) {
    const rows = rawRows(table);
    const pk = PK[table] ?? "id";
    for (let i = 0; i < rows.length; i += 400) {
      const writes = rows.slice(i, i + 400).map((r) => ({ update: { name: `projects/${cfg.projectId}/databases/${cfg.databaseId || "(default)"}/documents/${coll(cfg, table)}/${encodeURIComponent(String(r[pk]))}`, fields: Object.fromEntries(Object.entries(normalizeRow(table, r)).map(([k, v]) => [k, enc(v)])) } }));
      if (writes.length) await fsFetch(cfg, `${base(cfg).replace(/\/documents$/, "")}/documents:commit`, { method: "POST", body: JSON.stringify({ writes }) });
      total += writes.length;
    }
    onProgress?.(`${table}: ${rows.length}`);
  }
  await fsFetch(cfg, `/${coll(cfg, "meta")}/sync`, { method: "PATCH", body: JSON.stringify({ fields: { lastFullSync: enc(new Date().toISOString()), tables: enc(SYNCED_TABLES.length) } }) });
  return total;
}

async function listAll(c: Cfg, table: string) {
  const out: Record<string, unknown>[] = [];
  let pageToken: string | undefined;
  do {
    const j = (await fsFetch(c, `/${coll(c, table)}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ""}`)) as { documents?: { fields: Record<string, FsValue> }[]; nextPageToken?: string };
    for (const d of j.documents ?? []) out.push(Object.fromEntries(Object.entries(d.fields).map(([k, v]) => [k, dec(v)])));
    pageToken = j.nextPageToken;
  } while (pageToken);
  return out;
}

/** Rebuild SQLite from Firestore. Upserts every document (existing local rows with same id are overwritten). */
export async function restoreFromFirestore(c?: Cfg) {
  const cfg = c ?? isActive();
  if (!cfg) throw new Error("Firestore plugin not configured");
  let total = 0;
  const run = (q: string, params: unknown[]) => db.run(sql.raw(q.replace(/\?/g, () => { const v = params.shift(); return v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : typeof v === "boolean" ? (v ? "1" : "0") : `'${String(typeof v === "object" ? JSON.stringify(v) : v).replace(/'/g, "''")}'`; })));
  db.run(sql`PRAGMA foreign_keys = OFF`);
  for (const table of SYNCED_TABLES) {
    const docs = await listAll(cfg, table);
    for (const d of docs) {
      const cols = Object.keys(d);
      if (!cols.length) continue;
      run(`insert or replace into "${table}" (${cols.map((k) => `"${k}"`).join(",")}) values (${cols.map(() => "?").join(",")})`, cols.map((k) => d[k]));
      total++;
    }
  }
  db.run(sql`PRAGMA foreign_keys = ON`);
  return total;
}

export async function testFirestore(c: Cfg) {
  await getAccessToken(c);
  const j = (await fsFetch(c, `/${coll(c, "meta")}?pageSize=1`)) as { documents?: unknown[] };
  await fsFetch(c, `/${coll(c, "meta")}/ping`, { method: "PATCH", body: JSON.stringify({ fields: { at: enc(new Date().toISOString()) } }) });
  return `Connected to project ${c.projectId} (${c.databaseId || "(default)"}) — read/write OK${j.documents?.length ? ", existing data found" : ""}`;
}

export async function firestoreStatus() {
  const c = isActive();
  if (!c) return null;
  try {
    const j = (await fsFetch(c, `/${coll(c, "meta")}/sync`)) as { fields?: Record<string, FsValue> };
    return { lastFullSync: j.fields ? (dec(j.fields.lastFullSync) as string) : null };
  } catch {
    return { lastFullSync: null };
  }
}

export function localCounts() {
  return Object.fromEntries(SYNCED_TABLES.map((t) => [t, (db.get(sql.raw(`select count(*) as n from "${t}"`)) as { n: number }).n]));
}

// Background periodic full sync (interval from config). Idempotent across HMR.
declare global { var __fsTimer: NodeJS.Timeout | undefined }
export function scheduleAutoSync() {
  if (globalThis.__fsTimer) clearInterval(globalThis.__fsTimer);
  const c = isActive();
  const mins = Number(c?.autoSyncMinutes || 0);
  if (!c || !mins) return;
  globalThis.__fsTimer = setInterval(() => fullSync(c).catch((e) => console.error("[firestore] auto-sync failed", e)), mins * 60_000);
}
