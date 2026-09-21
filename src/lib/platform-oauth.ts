import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { getTenantIntegration, requireWorkspaceAccess } from "@/lib/platform";
import { getSession } from "@/lib/auth";
import { encryptSecret, decryptSecret } from "@/lib/secrets";
import { id } from "@/lib/utils";
import { testFirestore } from "@/lib/plugins/firestore";
import { exchangeGoogleCode, googleUserEmail, isGoogleOAuthConfigured, publicOrigin } from "@/lib/plugins/oauth";

const COOKIE = "workspace_firestore_google_oauth_state";
const TTL = 10 * 60;

type State = { tenantId: string; userId: string; projectId: string; returnTo: string; redirectUri: string; issuedAt: number; nonce: string };

function key() {
  return crypto.createHash("sha256").update(process.env.AUTH_SECRET ?? "dev-secret-change-me-please-32-chars-min").digest();
}
function encode(value: string) { return Buffer.from(value).toString("base64url"); }
function decode(value: string) { return Buffer.from(value, "base64url").toString("utf8"); }
function signature(value: string) { return crypto.createHmac("sha256", key()).update(`workspace-firestore:${value}`).digest("base64url"); }
function makeState(payload: State) { const value = encode(JSON.stringify(payload)); return `${value}.${signature(value)}`; }
function parseState(value: string): State | null {
  const [valuePart, sig] = value.split(".");
  const expected = valuePart ? signature(valuePart) : "";
  if (!valuePart || !sig || sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const state = JSON.parse(decode(valuePart)) as State;
    return state.tenantId && state.userId && state.projectId && (state.returnTo.startsWith("/platform/stores/") || state.returnTo === "/admin/settings") && Date.now() - state.issuedAt < TTL * 1000 ? state : null;
  } catch { return null; }
}
function errorPath(returnTo: string, message: string) { return `${returnTo}?oauth_error=${encodeURIComponent(message.slice(0, 180))}`; }

export async function startWorkspaceFirestoreOAuth(tenantId: string, returnTo: string, formData?: FormData) {
  const { session, tenant } = await requireWorkspaceAccess(tenantId);
  const safeReturnTo = returnTo === "/admin/settings" ? "/admin/settings" : `/platform/stores/${tenant.slug}`;
  if (!isGoogleOAuthConfigured()) redirect(errorPath(safeReturnTo, "Google OAuth is not configured on this Aurelia deployment."));
  const projectId = String(formData?.get("projectId") ?? "").trim();
  if (!projectId) redirect(errorPath(safeReturnTo, "Enter the Firebase project ID before connecting Google Cloud."));
  const origin = await publicOrigin();
  const redirectUri = `${origin}/api/oauth/google/firestore/callback`;
  const state = makeState({ tenantId: tenant.id, userId: session.id, projectId, returnTo: safeReturnTo, redirectUri, issuedAt: Date.now(), nonce: crypto.randomBytes(16).toString("hex") });
  const c = await cookies();
  c.set(COOKIE, state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TTL });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", ["openid", "email", "https://www.googleapis.com/auth/datastore"].join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  redirect(url.toString());
}

function previousConfig(tenantId: string) {
  const integration = getTenantIntegration(tenantId, "firestore");
  const encrypted = integration?.config?.encrypted;
  if (!encrypted) return {} as Record<string, string>;
  try { return JSON.parse(decryptSecret(encrypted)) as Record<string, string>; } catch { return {}; }
}

async function finish(state: State, email: string, refreshToken: string) {
  const { tenant } = await requireWorkspaceAccess(state.tenantId);
  const old = previousConfig(tenant.id);
  const config = {
    ...old,
    projectId: state.projectId,
    databaseId: old.databaseId || "(default)",
    collectionPrefix: old.collectionPrefix?.endsWith(`${tenant.slug}_`) ? old.collectionPrefix : `store_${tenant.slug}_`,
    authMode: "oauth",
    oauthEmail: email,
    oauthRefreshToken: refreshToken,
  };
  const message = await testFirestore(config);
  const existing = db.select().from(schema.tenantIntegrations).where(and(eq(schema.tenantIntegrations.tenantId, tenant.id), eq(schema.tenantIntegrations.provider, "firestore"))).get();
  const row = { tenantId: tenant.id, provider: "firestore", enabled: true, config: { encrypted: encryptSecret(JSON.stringify(config)) }, lastTestAt: new Date().toISOString(), lastTestOk: true, lastTestMessage: message };
  if (existing) db.update(schema.tenantIntegrations).set(row).where(eq(schema.tenantIntegrations.id, existing.id)).run();
  else db.insert(schema.tenantIntegrations).values({ id: id("int_"), ...row }).run();
}

export async function handleWorkspaceFirestoreCallback(request: Request) {
  const url = new URL(request.url);
  const c = await cookies();
  const rawState = url.searchParams.get("state") || "";
  const cookieState = c.get(COOKIE)?.value || "";
  c.delete(COOKIE);
  const state = rawState && rawState === cookieState ? parseState(rawState) : null;
  const session = await getSession();
  if (!state || !session || session.role !== "admin" || session.id !== state.userId) return Response.redirect(new URL(errorPath("/platform", "OAuth session expired. Start the connection again."), url.origin));
  if (url.searchParams.get("error")) return Response.redirect(new URL(errorPath(state.returnTo, `Google returned ${url.searchParams.get("error")}.`), url.origin));
  const code = url.searchParams.get("code");
  if (!code) return Response.redirect(new URL(errorPath(state.returnTo, "Google did not return an authorization code."), url.origin));
  try {
    const token = await exchangeGoogleCode(code, state.redirectUri);
    if (!token.refresh_token) throw new Error("Google did not issue a refresh token. Revoke the app in Google and try again.");
    const email = await googleUserEmail(token.access_token);
    await finish(state, email, token.refresh_token);
    return Response.redirect(new URL(`${state.returnTo}?oauth=connected`, url.origin));
  } catch (error) {
    return Response.redirect(new URL(errorPath(state.returnTo, error instanceof Error ? error.message : "Google connection failed"), url.origin));
  }
}
