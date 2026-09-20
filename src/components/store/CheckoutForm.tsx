"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { placeOrder, validateCoupon } from "@/actions/checkout";
import { formatMoney } from "@/lib/format";
import type { Totals } from "@/lib/cart";
import { Lock, Loader2 } from "lucide-react";

type Addr = { name: string; phone: string; line1: string; line2?: string | null; city: string; state: string; postalCode: string; country: string };
declare global { interface Window { Razorpay?: new (o: unknown) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void }; Cashfree?: (o: { mode: string }) => { checkout: (o: { paymentSessionId: string; redirectTarget: string }) => void } } }

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh","Andaman & Nicobar","Dadra & Nagar Haveli and Daman & Diu","Lakshadweep"];

export function CheckoutForm(props: { lines: { key: string; name: string; variantTitle?: string; image?: string; price: number; qty: number }[]; initialTotals: Totals; currency: string; user: { name: string; email: string } | null; addresses: (Addr & { id: string; label: string | null })[]; codEnabled: boolean; codFee: number; gateway: string | null; tax: { enabled: boolean; label: string; inclusive: boolean }; estimateText: string }) {
  const { currency } = props;
  const router = useRouter();
  const [addr, setAddr] = useState<Addr>({ name: props.user?.name ?? "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "IN" });
  const [email, setEmail] = useState(props.user?.email ?? "");
  const [pm, setPm] = useState<"online" | "cod">(props.gateway ? "online" : "cod");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<string | undefined>();
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [save, setSave] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [paying, setPaying] = useState(false);

  const t = props.initialTotals;
  const shipping = t.shipping + (pm === "cod" ? props.codFee : 0);
  const total = t.subtotal - discount + shipping + (props.tax.inclusive ? 0 : t.tax);
  const set = (k: keyof Addr) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAddr({ ...addr, [k]: e.target.value });

  const applyCoupon = () =>
    start(async () => {
      const r = await validateCoupon(coupon);
      if (r.ok) { setApplied(coupon.toUpperCase()); setDiscount(r.discount); setCouponMsg(null); }
      else { setApplied(undefined); setDiscount(0); setCouponMsg(r.error); }
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    start(async () => {
      const r = await placeOrder({ email, address: { ...addr, line2: addr.line2 ?? undefined }, paymentMethod: pm, couponCode: applied, note, saveAddress: save });
      if (!r.ok) return setErr(r.error);
      if (r.kind === "cod") return router.push(`/checkout/success/${r.orderId}`);
      setPaying(true);
      if (r.kind === "razorpay") {
        if (!window.Razorpay) { setPaying(false); return setErr("Payment SDK failed to load. Please refresh."); }
        const rzp = new window.Razorpay({
          key: r.keyId, amount: r.amount, currency: r.currency, name: r.storeName, order_id: r.gatewayOrderId,
          prefill: { name: r.name, email: r.email, contact: r.phone }, theme: { color: r.themeColor || "#0f172a" },
          modal: { ondismiss: () => setPaying(false) },
          handler: async (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            const v = await fetch("/api/payments/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: r.orderId, ...resp }) });
            if (v.ok) router.push(`/checkout/success/${r.orderId}`);
            else { setPaying(false); setErr("Payment verification failed. If money was deducted, it will be refunded automatically."); }
          },
        });
        rzp.on("payment.failed", () => { setPaying(false); setErr("Payment failed. Please try again."); });
        rzp.open();
      } else if (r.kind === "cashfree") {
        if (!window.Cashfree) { setPaying(false); return setErr("Payment SDK failed to load. Please refresh."); }
        window.Cashfree({ mode: r.mode }).checkout({ paymentSessionId: r.paymentSessionId, redirectTarget: "_self" });
      }
    });
  };

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-10">
      {props.gateway === "razorpay" && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />}
      {props.gateway === "cashfree" && <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" />}
      <div className="space-y-8">
        <section className="card p-6">
          <h2 className="font-semibold mb-4">Contact</h2>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email for order updates" className="input" />
          {!props.user && <p className="text-xs text-gray-500 mt-2">Have an account? <a href="/login?next=/checkout" className="underline">Log in</a> for faster checkout.</p>}
        </section>
        <section className="card p-6">
          <h2 className="font-semibold mb-4">Shipping address</h2>
          {props.addresses.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {props.addresses.map((a) => (
                <button type="button" key={a.id} onClick={() => setAddr({ name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, postalCode: a.postalCode, country: a.country })} className="rounded-lg border px-3 py-2 text-left text-xs hover:border-gray-900">
                  <div className="font-medium">{a.label || "Saved"}</div><div className="text-gray-500">{a.line1}, {a.city}</div>
                </button>
              ))}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <input required placeholder="Full name" value={addr.name} onChange={set("name")} className="input" />
            <input required placeholder="Phone" value={addr.phone} onChange={set("phone")} className="input" inputMode="tel" />
            <input required placeholder="Address line 1" value={addr.line1} onChange={set("line1")} className="input sm:col-span-2" />
            <input placeholder="Apartment, landmark (optional)" value={addr.line2 ?? ""} onChange={set("line2")} className="input sm:col-span-2" />
            <input required placeholder="City" value={addr.city} onChange={set("city")} className="input" />
            <select required value={addr.state} onChange={set("state")} className="input"><option value="">State</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
            <input required placeholder="PIN code" value={addr.postalCode} onChange={set("postalCode")} className="input" inputMode="numeric" />
            <input value="India" disabled className="input bg-gray-50" />
          </div>
          {props.user && <label className="mt-3 flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} /> Save this address for next time</label>}
          <textarea placeholder="Order note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="input mt-3" rows={2} />
        </section>
        <section className="card p-6">
          <h2 className="font-semibold mb-4">Payment</h2>
          <div className="space-y-2">
            {props.gateway && (
              <label className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer ${pm === "online" ? "border-gray-900 bg-gray-50" : ""}`}>
                <input type="radio" checked={pm === "online"} onChange={() => setPm("online")} />
                <div className="flex-1"><div className="font-medium text-sm">Pay online</div><div className="text-xs text-gray-500">UPI, cards, netbanking, wallets · secured by {props.gateway === "razorpay" ? "Razorpay" : "Cashfree"}</div></div>
                <Lock className="h-4 w-4 text-gray-400" />
              </label>
            )}
            {props.codEnabled && (
              <label className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer ${pm === "cod" ? "border-gray-900 bg-gray-50" : ""}`}>
                <input type="radio" checked={pm === "cod"} onChange={() => setPm("cod")} />
                <div className="flex-1"><div className="font-medium text-sm">Cash on Delivery</div><div className="text-xs text-gray-500">Pay when your order arrives{props.codFee ? ` · ${formatMoney(props.codFee, currency)} handling fee` : ""}</div></div>
              </label>
            )}
            {!props.gateway && !props.codEnabled && <p className="text-sm text-red-600">No payment methods are configured. Please contact the store.</p>}
          </div>
        </section>
      </div>

      <aside className="card p-6 h-fit lg:sticky lg:top-24">
        <h2 className="font-semibold mb-4">Order summary</h2>
        <ul className="space-y-3 max-h-72 overflow-auto pr-1">
          {props.lines.map((l) => (
            <li key={l.key} className="flex gap-3 text-sm">
              <div className="relative h-14 w-14 shrink-0 rounded-md bg-gray-100 overflow-hidden">{l.image && <img src={l.image} alt="" className="h-full w-full object-cover" />}<span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] rounded-full h-5 min-w-5 px-1 flex items-center justify-center">{l.qty}</span></div>
              <div className="flex-1 min-w-0"><div className="line-clamp-1">{l.name}</div>{l.variantTitle && <div className="text-xs text-gray-500">{l.variantTitle}</div>}</div>
              <div>{formatMoney(l.price * l.qty, currency)}</div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" className="input uppercase" />
          <button type="button" onClick={applyCoupon} disabled={!coupon || pending} className="btn-outline shrink-0">Apply</button>
        </div>
        {couponMsg && <p className="text-xs text-red-600 mt-1">{couponMsg}</p>}
        {applied && <p className="text-xs text-green-700 mt-1">Coupon {applied} applied</p>}
        <dl className="mt-4 space-y-2 text-sm border-t pt-4">
          <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{formatMoney(t.subtotal, currency)}</dd></div>
          {discount > 0 && <div className="flex justify-between text-green-700"><dt>Discount</dt><dd>-{formatMoney(discount, currency)}</dd></div>}
          <div className="flex justify-between"><dt className="text-gray-600">Shipping</dt><dd>{shipping ? formatMoney(shipping, currency) : "Free"}</dd></div>
          {props.tax.enabled && <div className="flex justify-between text-gray-500"><dt>{props.tax.label}{props.tax.inclusive ? " (included)" : ""}</dt><dd>{formatMoney(t.tax, currency)}</dd></div>}
          <div className="flex justify-between border-t pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(total, currency)}</dd></div>
        </dl>
        {err && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg p-2.5">{err}</p>}
        <button disabled={pending || paying || (!props.gateway && !props.codEnabled)} className="btn-primary w-full mt-5 py-3">
          {pending || paying ? <><Loader2 className="h-4 w-4 animate-spin" /> {paying ? "Waiting for payment…" : "Processing…"}</> : pm === "cod" ? "Place order" : `Pay ${formatMoney(total, currency)}`}
        </button>
        <p className="mt-3 text-[11px] text-gray-500 text-center">{props.estimateText}</p>
      </aside>
    </form>
  );
}
