import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, requireAdmin } from "@/lib/auth";
import { getPluginState, savePlugin } from "@/lib/plugins/store";
import { pluginById } from "@/lib/plugins/registry";

export const GOOGLE_OAUTH_STATE_COOKIE = "plugin_google_oauth_state";
const STATE_TTL_SECONDS = 10 * 60;

type OAuthState = {
  pluginId: string;
  userId: string;
  returnTo: string;
  redirectUri: string;
  nonce: string;
  issuedAt: number;
};

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

function secretKey() {
  return crypto.createHash("sha256").update(process.env.AUTH_SECRET ?? "dev-secret-change-me-please-32-chars-min").digest();
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return crypto.createHmac("sha256", secretKey()).update(value).digest("base64url");
}

function makeState(payload: OAuthState) {
  const encoded = encode(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function parseState(value: string): OAuthState | null {
  const [encoded, signature] = value.split(".");
  const expected = encoded ? sign(encoded) : "";
  if (!encoded || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(decode(encoded)) as OAuthState;
    if (!payload.pluginId || !payload.userId || !payload.returnTo || !payload.redirectUri || !payload.issuedAt) return null;
    if (Date.now() - payload.issuedAt > STATE_TTL_SECONDS * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

function safeReturnTo(value: string) {
  return value.startsWith("/admin/plugins/") && !value.startsWith("//") ? value : "/admin/plugins";
}

export async function publicOrigin() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const protocol = h.get("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
  const host = h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host");
  if (!host) throw new Error("Cannot determine the public site URL");
  return `${protocol}://${host}`;
}

function oauthErrorPath(returnTo: string, message: string) {
  return `${safeReturnTo(returnTo)}?oauth_error=${encodeURIComponent(message.slice(0, 180))}`;
}

function configured() {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

/** Starts the provider-owned OAuth flow from a plugin settings page. */
export async function startGooglePluginOAuth(pluginId: string, returnTo: string, formData?: FormData) {
  const session = await requireAdmin();
  const target = safeReturnTo(returnTo);
  const def = pluginById(pluginId);
  if (!def?.oauth || def.oauth.provider !== "google") redirect(oauthErrorPath(target, "This plugin does not support Google OAuth."));
  if (!configured()) redirect(oauthErrorPath(target, "Google OAuth is not configured on this Aurelia deployment. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."));
  let config = getPluginState(pluginId).config;
  if (pluginId === "firestore") {
    const projectId = String(formData?.get("projectId") ?? "").trim();
    if (projectId && projectId !== config.projectId) {
      savePlugin(pluginId, { enabled: false, config: { projectId } });
      config = getPluginState(pluginId).config;
    }
    if (!config.projectId) redirect(oauthErrorPath(target, "Enter the Firestore project ID before connecting Google Cloud."));
  }
  const origin = await publicOrigin();
  const redirectUri = `${origin}/api/oauth/google/callback`;
  const state = makeState({ pluginId, userId: session.id, returnTo: target, redirectUri, nonce: crypto.randomBytes(16).toString("hex"), issuedAt: Date.now() });
  const c = await cookies();
  c.set(GOOGLE_OAUTH_STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: STATE_TTL_SECONDS });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", def.oauth.scopes.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  redirect(url.toString());
}

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  if (!configured()) throw new Error("Google OAuth is not configured");
  const body = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, code, grant_type: "authorization_code", redirect_uri: redirectUri });
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  const data = (await response.json()) as GoogleTokenResponse & { error?: string; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || "Google authorization failed");
  return data;
}

export async function googleUserEmail(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  const data = (await response.json()) as { email?: string; email_verified?: boolean };
  if (!response.ok || !data.email) throw new Error("Google did not return an email address");
  return data.email;
}

export async function finishGooglePluginOAuth(state: OAuthState, refreshToken: string, email: string) {
  const current = getPluginState(state.pluginId).config;
  if (state.pluginId === "firestore") {
    if (!current.projectId) throw new Error("Save a Firestore project ID before connecting Google Cloud.");
    savePlugin(state.pluginId, { enabled: false, config: { authMode: "oauth", oauthEmail: email, oauthRefreshToken: refreshToken } });
  } else if (state.pluginId === "smtp") {
    savePlugin(state.pluginId, { enabled: false, config: { authMode: "oauth", oauthEmail: email, oauthRefreshToken: refreshToken, host: "smtp.gmail.com", port: "465", secure: "true", user: email, fromEmail: current.fromEmail || email } });
  } else {
    throw new Error("OAuth is not implemented for this plugin.");
  }
}

export async function disconnectPluginOAuth(pluginId: string) {
  const session = await requireAdmin();
  const def = pluginById(pluginId);
  if (!def?.oauth) throw new Error("This plugin does not use OAuth");
  savePlugin(pluginId, { enabled: false, remove: ["authMode", "oauthEmail", "oauthRefreshToken"] });
  return { ok: true as const, message: `Disconnected ${def.name} OAuth for ${session.email}` };
}

export function isOAuthConnected(pluginId: string, config: Record<string, string>) {
  return !!pluginById(pluginId)?.oauth && config.authMode === "oauth" && !!config.oauthRefreshToken;
}

export function isGoogleOAuthConfigured() {
  return configured();
}

export async function handleGoogleCallback(request: Request) {
  const url = new URL(request.url);
  const returnTo = "/admin/plugins";
  const c = await cookies();
  const rawState = url.searchParams.get("state") || "";
  const cookieState = c.get(GOOGLE_OAUTH_STATE_COOKIE)?.value || "";
  c.delete(GOOGLE_OAUTH_STATE_COOKIE);
  const state = rawState && cookieState && rawState === cookieState ? parseState(rawState) : null;
  const session = await getSession();
  if (!state || !session || session.role !== "admin" || session.id !== state.userId) return Response.redirect(new URL(oauthErrorPath(returnTo, "OAuth session expired. Start the connection again."), url.origin));
  const target = state.returnTo;
  const oauthError = url.searchParams.get("error");
  if (oauthError) return Response.redirect(new URL(oauthErrorPath(target, `Google returned ${oauthError}.`), url.origin));
  const code = url.searchParams.get("code");
  if (!code) return Response.redirect(new URL(oauthErrorPath(target, "Google did not return an authorization code."), url.origin));
  try {
    const token = await exchangeGoogleCode(code, state.redirectUri);
    if (!token.refresh_token) throw new Error("Google did not issue a refresh token. Revoke the app in your Google account and try again.");
    const email = await googleUserEmail(token.access_token);
    await finishGooglePluginOAuth(state, token.refresh_token, email);
    return Response.redirect(new URL(`${target}?oauth=connected`, url.origin));
  } catch (error) {
    return Response.redirect(new URL(oauthErrorPath(target, error instanceof Error ? error.message : "Google authorization failed"), url.origin));
  }
}

export async function refreshGoogleAccessToken(config: Record<string, string>) {
  if (!config.oauthRefreshToken || !configured()) throw new Error("Google OAuth credentials are not configured");
  const body = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, refresh_token: config.oauthRefreshToken, grant_type: "refresh_token" });
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  const data = (await response.json()) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || "Google token refresh failed");
  return data;
}
