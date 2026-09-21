"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Lock, Loader2, Tag, ShieldCheck, Truck } from "lucide-react";
import { placeOrder, validateCoupon } from "@/actions/checkout";
import { formatMoney } from "@/lib/format";
import type { Totals } from "@/lib/cart";

declare global {
  interface Window {
    Razorpay?: new (o: unknown) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
    Cashfree?: (o: { mode: string }) => { checkout: (o: { paymentSessionId: string; redirectTarget: string }) => void };
  }
}

type Addr = { name: string; phone: string; line1: string; line2?: string; city: string; state: string; postalCode: string; country: string };

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh","Lakshadweep"];

/** Single-page checkout of one website — orders land in this site's own book. */
export function TenantCheckoutForm({
  base,
  tenantId,
  initialTotals,
  currency,
  gateway,
  codEnabled,
  codFee,
  estimateText,
  taxLabel,
  taxInclusive,
  storeName,
}: {
  base: string;
  tenantId: string;
  initialTotals: Totals;
  currency: string;
  gateway: string | null;
  codEnabled: boolean;
  codFee: number;
  estimateText: string;
  taxLabel: string;
  taxInclusive: boolean;
  storeName: string;
}) {
  const router = useRouter();
  const [addr, setAddr] = useState<Addr>({ name: "", phone: "", line1: "", city: "", state: "", postalCode: "", country: "IN" });
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [pm, setPm] = useState<"online" | "cod">(gateway && codEnabled ? "online" : gateway ? "online" : "cod");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<string | undefined>();
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [pending, start] = useTransition();

  const t = initialTotals;
  const shipping = t.shipping + (pm === "cod" && codEnabled ? codFee : 0);
  const total = t.subtotal - discount + shipping + (taxInclusive ? 0 : t.tax);
  const set = (k: keyof Addr) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAddr({ ...addr, [k]: e.target.value });

  const applyCoupon = () =>
    start(async () => {
      const r = await validateCoupon(coupon, tenantId);
      if (r.ok) {
        setApplied(coupon.toUpperCase());
        setDiscount(r.discount);
        setCouponMsg(null);
      } else {
        setApplied(undefined);
        setDiscount(0);
        setCouponMsg(r.error);
      }
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (addr.phone.replace(/\D/g, "").length < 10) return setErr("Please enter a valid 10-digit mobile number");
    start(async () => {
      const r = await placeOrder({ email, address: addr, paymentMethod: pm, couponCode: applied, note, tenantId, base });
      if (!r.ok) return setErr(r.error);
      if (r.kind === "cod") return router.push(`${base}/checkout/success/${r.orderId}`);
      setPaying(true);
      if (r.kind === "razorpay") {
        if (!window.Razorpay) {
          setPaying(false);
          return setErr("Payment SDK failed to load. Please refresh.");
        }
        const rzp = new window.Razorpay({
          key: r.keyId,
          amount: r.amount,
          currency: r.currency,
          name: storeName || r.storeName,
          order_id: r.gatewayOrderId,
          prefill: { name: r.name, email: r.email, contact: r.phone },
          theme: { color: r.themeColor || "#0f172a" },
          modal: { ondismiss: () => setPaying(false) },
          handler: async (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            const v = await fetch("/api/payments/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: r.orderId, ...resp }) });
            if (v.ok) router.push(`${base}/checkout/success/${r.orderId}`);
            else {
              setPaying(false);
              setErr("Payment verification failed. If money was deducted, it will be refunded automatically.");
            }
          },
        });
        rzp.on("payment.failed", () => {
          setPaying(false);
          setErr("Payment failed. Please try again.");
        });
        rzp.open();
      } else if (r.kind === "cashfree") {
        if (!window.Cashfree) {
          setPaying(false);
          return setErr("Payment SDK failed to load. Please refresh.");
        }
        window.Cashfree({ mode: r.mode }).checkout({ paymentSessionId: r.paymentSessionId, redirectTarget: "_self" });
      }
    });
  };

  return (
    <form onSubmit={submit} className="s-checkout-layout">
      {gateway === "razorpay" && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />}
      {gateway === "cashfree" && <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" />}

      <div className="s-checkout-form">
        <section className="s-card s-pad">
          <h2 className="s-h3">Contact & delivery</h2>
          <div className="s-grid-2">
            <div className="s-field-full">
              <label className="s-label">Email for order updates *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="s-input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="s-label">Full name *</label>
              <input required value={addr.name} onChange={set("name")} className="s-input" placeholder="Your name" />
            </div>
            <div>
              <label className="s-label">Mobile *</label>
              <input required value={addr.phone} onChange={set("phone")} className="s-input" placeholder="10-digit number" />
            </div>
            <div className="s-field-full">
              <label className="s-label">Address *</label>
              <input required value={addr.line1} onChange={set("line1")} className="s-input" placeholder="House no., street, area" />
            </div>
            <div>
              <label className="s-label">City *</label>
              <input required value={addr.city} onChange={set("city")} className="s-input" />
            </div>
            <div>
              <label className="s-label">State *</label>
              <select required value={addr.state} onChange={set("state")} className="s-input">
                <option value="">Select state</option>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="s-label">PIN code *</label>
              <input required value={addr.postalCode} onChange={(e) => setAddr({ ...addr, postalCode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className="s-input" placeholder="6 digits" />
            </div>
            <div>
              <label className="s-label">Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className="s-input" placeholder="Delivery instructions" />
            </div>
          </div>
        </section>

        <section className="s-card s-pad">
          <h2 className="s-h3">Payment</h2>
          <div className="s-pay-options">
            {gateway ? (
              <label className={`s-pay-option ${pm === "online" ? "is-active" : ""}`}>
                <input type="radio" name="pm" checked={pm === "online"} onChange={() => setPm("online")} />
                <span>
                  <b>Pay online</b>
                  <small>UPI, cards, netbanking via {gateway === "razorpay" ? "Razorpay" : "Cashfree"}</small>
                </span>
              </label>
            ) : null}
            {codEnabled ? (
              <label className={`s-pay-option ${pm === "cod" ? "is-active" : ""}`}>
                <input type="radio" name="pm" checked={pm === "cod"} onChange={() => setPm("cod")} />
                <span>
                  <b>Cash on delivery</b>
                  <small>{codFee ? `Includes ${formatMoney(codFee, currency)} handling` : "Pay when it arrives"}</small>
                </span>
              </label>
            ) : null}
          </div>
          {!gateway && !codEnabled ? <p className="s-error">No payment method is available. Please contact the store.</p> : null}
          <p className="s-note s-note-inline"><Truck className="h-3.5 w-3.5" /> {estimateText}</p>
        </section>
      </div>

      <aside className="s-summary">
        <h2 className="s-h3">Order summary</h2>
        <div className="s-coupon">
          <Tag className="h-4 w-4" />
          <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" className="s-input" />
          <button type="button" onClick={applyCoupon} disabled={pending || !coupon} className="s-btn s-btn-outline">Apply</button>
        </div>
        {couponMsg ? <p className="s-error">{couponMsg}</p> : null}
        {applied && !couponMsg ? <p className="s-ok">Coupon {applied} applied</p> : null}
        <dl className="s-summary-list">
          <div><dt>Subtotal</dt><dd>{formatMoney(t.subtotal, currency)}</dd></div>
          {discount ? <div><dt>Discount</dt><dd>−{formatMoney(discount, currency)}</dd></div> : null}
          <div><dt>Shipping</dt><dd>{shipping ? formatMoney(shipping, currency) : "Free"}</dd></div>
          {taxInclusive ? null : <div><dt>{taxLabel}</dt><dd>{formatMoney(t.tax, currency)}</dd></div>}
          <div className="s-summary-total"><dt>Total</dt><dd>{formatMoney(total, currency)}</dd></div>
        </dl>
        {err ? <p className="s-error">{err}</p> : null}
        <button type="submit" disabled={pending || paying || (!gateway && !codEnabled)} className="s-btn s-btn-primary s-btn-lg s-btn-block">
          {pending || paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {paying ? "Waiting for payment…" : `Place order · ${formatMoney(total, currency)}`}
        </button>
        <p className="s-note s-note-inline"><ShieldCheck className="h-3.5 w-3.5" /> Secure checkout — your details stay with {storeName}.</p>
      </aside>
    </form>
  );
}
