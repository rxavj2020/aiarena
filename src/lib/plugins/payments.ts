import crypto from "node:crypto";
import { getPluginState } from "./store";

// ---------- Razorpay ----------
function rzpAuth(c: Record<string, string>) {
  return "Basic " + Buffer.from(`${c.keyId}:${c.keySecret}`).toString("base64");
}

export async function razorpayCreateOrder(amount: number, receipt: string, currency = "INR") {
  const c = getPluginState("razorpay").config;
  const r = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: rzpAuth(c), "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency, receipt, payment_capture: 1 }),
  });
  if (!r.ok) throw new Error(`Razorpay: ${(await r.text()).slice(0, 300)}`);
  const data = (await r.json()) as { id: string };
  return { gatewayOrderId: data.id, keyId: c.keyId, themeColor: c.themeColor };
}

export function razorpayVerifySignature(orderId: string, paymentId: string, signature: string) {
  const c = getPluginState("razorpay").config;
  const expected = crypto.createHmac("sha256", c.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function razorpayVerifyWebhook(rawBody: string, signature: string) {
  const c = getPluginState("razorpay").config;
  if (!c.webhookSecret) return false;
  const expected = crypto.createHmac("sha256", c.webhookSecret).update(rawBody).digest("hex");
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function testRazorpay(c: Record<string, string>) {
  const r = await fetch("https://api.razorpay.com/v1/payments?count=1", { headers: { Authorization: rzpAuth(c) } });
  if (!r.ok) throw new Error(`Authentication failed (${r.status}). Check Key ID / Secret.`);
  return `Authenticated as ${c.keyId} (${c.keyId.startsWith("rzp_test") ? "TEST mode" : "LIVE mode"})`;
}

// ---------- Cashfree ----------
function cfBase(c: Record<string, string>) {
  return c.environment === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}
function cfHeaders(c: Record<string, string>) {
  return { "x-client-id": c.appId, "x-client-secret": c.secretKey, "x-api-version": "2023-08-01", "Content-Type": "application/json" };
}

export async function cashfreeCreateOrder(input: { orderId: string; amount: number; currency: string; customer: { id: string; email: string; phone: string; name: string }; returnUrl: string; notifyUrl: string }) {
  const c = getPluginState("cashfree").config;
  const r = await fetch(`${cfBase(c)}/orders`, {
    method: "POST",
    headers: cfHeaders(c),
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: +(input.amount / 100).toFixed(2),
      order_currency: input.currency,
      customer_details: { customer_id: input.customer.id, customer_email: input.customer.email, customer_phone: input.customer.phone.replace(/\D/g, "").slice(-10), customer_name: input.customer.name },
      order_meta: { return_url: input.returnUrl, notify_url: input.notifyUrl },
    }),
  });
  if (!r.ok) throw new Error(`Cashfree: ${(await r.text()).slice(0, 300)}`);
  const data = (await r.json()) as { payment_session_id: string; cf_order_id: string };
  return { paymentSessionId: data.payment_session_id, cfOrderId: data.cf_order_id, mode: c.environment === "production" ? "production" : "sandbox" };
}

export async function cashfreeFetchOrder(orderId: string) {
  const c = getPluginState("cashfree").config;
  const r = await fetch(`${cfBase(c)}/orders/${orderId}`, { headers: cfHeaders(c) });
  if (!r.ok) throw new Error("Cashfree order lookup failed");
  return (await r.json()) as { order_status: "PAID" | "ACTIVE" | "EXPIRED" | "TERMINATED"; cf_order_id: string };
}

export function cashfreeVerifyWebhook(rawBody: string, signature: string, timestamp: string) {
  const c = getPluginState("cashfree").config;
  const expected = crypto.createHmac("sha256", c.secretKey).update(timestamp + rawBody).digest("base64");
  return expected === signature;
}

export async function testCashfree(c: Record<string, string>) {
  const r = await fetch(`${cfBase(c)}/orders/__connection_test__`, { headers: cfHeaders(c) });
  // 404 = auth OK but order not found; 401/403 = bad keys
  if (r.status === 401 || r.status === 403) throw new Error(`Authentication failed (${r.status}). Check App ID / Secret / environment.`);
  return `Authenticated with Cashfree (${c.environment})`;
}

// ---------- Cloudflare ----------
export async function cloudflarePurge(c: Record<string, string>) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/zones/${c.zoneId}/purge_cache`, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.apiToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ purge_everything: true }),
  });
  const data = (await r.json()) as { success: boolean; errors?: { message: string }[] };
  if (!data.success) throw new Error(data.errors?.map((e) => e.message).join(", ") || "Purge failed");
  return "Cache purged successfully";
}

export async function testCloudflare(c: Record<string, string>) {
  if (!c.zoneId || !c.apiToken) throw new Error("Zone ID and API token are needed for the API connection (the guide works without them).");
  const r = await fetch(`https://api.cloudflare.com/client/v4/zones/${c.zoneId}`, { headers: { Authorization: `Bearer ${c.apiToken}` } });
  const data = (await r.json()) as { success: boolean; result?: { name: string; status: string }; errors?: { message: string }[] };
  if (!data.success) throw new Error(data.errors?.map((e) => e.message).join(", ") || "Invalid token/zone");
  return `Connected to zone ${data.result?.name} (${data.result?.status})`;
}
