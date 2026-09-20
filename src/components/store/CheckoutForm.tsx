"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { placeOrder, validateCoupon } from "@/actions/checkout";
import { formatMoney } from "@/lib/format";
import type { Totals } from "@/lib/cart";
import { Lock, Loader2, ShieldCheck, CheckCircle2, Sparkles, Truck } from "lucide-react";
import { useStore } from "@/lib/store/useStore";

type Addr = {
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

declare global {
  interface Window {
    Razorpay?: new (o: unknown) => {
      open: () => void;
      on: (e: string, cb: (r: unknown) => void) => void;
    };
    Cashfree?: (o: { mode: string }) => {
      checkout: (o: { paymentSessionId: string; redirectTarget: string }) => void;
    };
  }
}

const STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
  "Andaman & Nicobar",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Lakshadweep",
];

function inferStateFromPin(pin: string): string | null {
  if (pin.length < 2) return null;
  const p2 = parseInt(pin.substring(0, 2), 10);
  if (p2 === 11) return "Delhi";
  if (p2 >= 12 && p2 <= 13) return "Haryana";
  if (p2 >= 14 && p2 <= 15) return "Punjab";
  if (p2 === 16) return "Chandigarh";
  if (p2 === 17) return "Himachal Pradesh";
  if (p2 >= 18 && p2 <= 19) return "Jammu & Kashmir";
  if (p2 >= 20 && p2 <= 28) return "Uttar Pradesh";
  if (p2 >= 30 && p2 <= 34) return "Rajasthan";
  if (p2 >= 36 && p2 <= 39) return "Gujarat";
  if (p2 >= 40 && p2 <= 44) return "Maharashtra";
  if (p2 >= 45 && p2 <= 48) return "Madhya Pradesh";
  if (p2 === 49) return "Chhattisgarh";
  if (p2 >= 50 && p2 <= 53) return "Andhra Pradesh";
  if (p2 >= 56 && p2 <= 59) return "Karnataka";
  if (p2 >= 60 && p2 <= 64) return "Tamil Nadu";
  if (p2 >= 67 && p2 <= 69) return "Kerala";
  if (p2 >= 70 && p2 <= 74) return "West Bengal";
  if (p2 >= 75 && p2 <= 77) return "Odisha";
  if (p2 === 78) return "Assam";
  if (p2 >= 80 && p2 <= 85) return "Bihar";
  return null;
}

export function CheckoutForm(props: {
  lines: {
    key: string;
    name: string;
    variantTitle?: string;
    image?: string;
    price: number;
    qty: number;
    compareAtPrice?: number | null;
  }[];
  initialTotals: Totals;
  currency: string;
  user: { name: string; email: string } | null;
  addresses: (Addr & { id: string; label: string | null })[];
  codEnabled: boolean;
  codFee: number;
  gateway: string | null;
  tax: { enabled: boolean; label: string; inclusive: boolean };
  estimateText: string;
}) {
  const { currency } = props;
  const router = useRouter();
  const { savedPincode } = useStore();

  const [addr, setAddr] = useState<Addr>({
    name: props.user?.name ?? "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
  });

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

  // Pre-fill PIN code from product estimator if user previously checked it
  useEffect(() => {
    if (savedPincode && savedPincode.length === 6 && !addr.postalCode) {
      const detectedState = inferStateFromPin(savedPincode);
      setAddr((prev) => ({
        ...prev,
        postalCode: savedPincode,
        state: detectedState || prev.state,
      }));
    }
  }, [savedPincode]);

  const t = props.initialTotals;
  const shipping = t.shipping + (pm === "cod" ? props.codFee : 0);
  const total = t.subtotal - discount + shipping + (props.tax.inclusive ? 0 : t.tax);

  // Calculate total savings (Flipkart / Amazon hallmark)
  const totalSavings = discount;

  const handlePostalCodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    const detected = inferStateFromPin(cleaned);
    setAddr((prev) => ({
      ...prev,
      postalCode: cleaned,
      state: detected || prev.state,
    }));
  };

  const set = (k: keyof Addr) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setAddr({ ...addr, [k]: e.target.value });

  const applyCoupon = () =>
    start(async () => {
      const r = await validateCoupon(coupon);
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

    // Basic phone validation
    const cleanPhone = addr.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return setErr("Please enter a valid 10-digit mobile phone number");
    }

    start(async () => {
      const r = await placeOrder({
        email,
        address: { ...addr, line2: addr.line2 ?? undefined },
        paymentMethod: pm,
        couponCode: applied,
        note,
        saveAddress: save,
      });

      if (!r.ok) return setErr(r.error);
      if (r.kind === "cod") return router.push(`/checkout/success/${r.orderId}`);

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
          name: r.storeName,
          order_id: r.gatewayOrderId,
          prefill: { name: r.name, email: r.email, contact: r.phone },
          theme: { color: r.themeColor || "#0f172a" },
          modal: { ondismiss: () => setPaying(false) },
          handler: async (resp: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            const v = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: r.orderId, ...resp }),
            });
            if (v.ok) router.push(`/checkout/success/${r.orderId}`);
            else {
              setPaying(false);
              setErr(
                "Payment verification failed. If money was deducted, it will be refunded automatically."
              );
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
        window.Cashfree({ mode: r.mode }).checkout({
          paymentSessionId: r.paymentSessionId,
          redirectTarget: "_self",
        });
      }
    });
  };

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-8 lg:gap-10">
      {props.gateway === "razorpay" && (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      )}
      {props.gateway === "cashfree" && (
        <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" />
      )}

      <div className="space-y-6">
        {/* Step 1: Contact Information */}
        <section className="card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base text-gray-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                1
              </span>
              Contact Information
            </h2>
            {!props.user && (
              <a href="/login?next=/checkout" className="text-xs text-primary font-medium hover:underline">
                Have an account? Log in
              </a>
            )}
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address for order confirmation & tracking"
            className="input"
          />
        </section>

        {/* Step 2: Shipping Address */}
        <section className="card p-6 shadow-xs">
          <h2 className="font-semibold text-base text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
              2
            </span>
            Delivery Address
          </h2>

          {props.addresses.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 font-medium mb-2">Saved Addresses:</div>
              <div className="flex flex-wrap gap-2">
                {props.addresses.map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() =>
                      setAddr({
                        name: a.name,
                        phone: a.phone,
                        line1: a.line1,
                        line2: a.line2 ?? "",
                        city: a.city,
                        state: a.state,
                        postalCode: a.postalCode,
                        country: a.country,
                      })
                    }
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs hover:border-gray-900 transition"
                  >
                    <div className="font-semibold text-gray-900">{a.label || "Saved"}</div>
                    <div className="text-gray-500 truncate max-w-[200px]">
                      {a.line1}, {a.city}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="Full Name"
              value={addr.name}
              onChange={set("name")}
              className="input"
            />
            <input
              required
              placeholder="10-digit Mobile Number"
              value={addr.phone}
              onChange={(e) => setAddr({ ...addr, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              className="input"
              inputMode="tel"
            />
            <input
              required
              placeholder="Flat, House no., Building, Street"
              value={addr.line1}
              onChange={set("line1")}
              className="input sm:col-span-2"
            />
            <input
              placeholder="Apartment, Landmark, Area (Optional)"
              value={addr.line2 ?? ""}
              onChange={set("line2")}
              className="input sm:col-span-2"
            />
            <div>
              <input
                required
                placeholder="6-digit PIN code"
                value={addr.postalCode}
                onChange={(e) => handlePostalCodeChange(e.target.value)}
                className="input"
                inputMode="numeric"
                maxLength={6}
              />
              <span className="text-[10px] text-gray-500 mt-1 block">
                Auto-fills state automatically
              </span>
            </div>
            <input
              required
              placeholder="City / Town"
              value={addr.city}
              onChange={set("city")}
              className="input"
            />
            <select
              required
              value={addr.state}
              onChange={set("state")}
              className="input"
            >
              <option value="">Select State</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input value="India" disabled className="input bg-gray-50 text-gray-500" />
          </div>

          {props.user && (
            <label className="mt-4 flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={save}
                onChange={(e) => setSave(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Save this address for future orders
            </label>
          )}

          <textarea
            placeholder="Delivery instructions (e.g. Leave with security, call upon arrival...)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input mt-3 text-xs"
            rows={2}
          />
        </section>

        {/* Step 3: Payment Method */}
        <section className="card p-6 shadow-xs">
          <h2 className="font-semibold text-base text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
              3
            </span>
            Payment Method
          </h2>

          <div className="space-y-3">
            {props.gateway && (
              <label
                className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${
                  pm === "online"
                    ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="pm"
                  checked={pm === "online"}
                  onChange={() => setPm("online")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                    Pay Online (Instant & Recommended)
                    <span className="badge bg-emerald-100 text-emerald-800 text-[10px]">
                      Fastest
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-600">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    256-Bit Bank Grade Encryption · Secured by{" "}
                    {props.gateway === "razorpay" ? "Razorpay" : "Cashfree"}
                  </div>
                </div>
                <Lock className="h-4 w-4 text-gray-400" />
              </label>
            )}

            {props.codEnabled && (
              <label
                className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${
                  pm === "cod"
                    ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="pm"
                  checked={pm === "cod"}
                  onChange={() => setPm("cod")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">
                    Cash on Delivery (COD)
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Pay in cash or UPI when your package arrives at your doorstep
                    {props.codFee
                      ? ` · ${formatMoney(props.codFee, currency)} handling fee`
                      : ""}
                  </div>
                </div>
                <Truck className="h-4 w-4 text-gray-400" />
              </label>
            )}

            {!props.gateway && !props.codEnabled && (
              <p className="text-sm text-red-600">
                No payment methods are configured. Please contact the store.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Aside Order Summary */}
      <aside className="card p-6 h-fit lg:sticky lg:top-24 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="font-semibold text-base text-gray-900">Order Summary</h2>
          <span className="text-xs text-gray-500 font-medium">
            {props.lines.reduce((a, b) => a + b.qty, 0)} items
          </span>
        </div>

        {/* Flipkart-Style Total Savings Highlight */}
        {totalSavings > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              🎉 You are saving <b>{formatMoney(totalSavings, currency)}</b> on this order!
            </span>
          </div>
        )}

        <ul className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-gray-100">
          {props.lines.map((l) => (
            <li key={l.key} className="flex gap-3 text-xs pt-3 first:pt-0">
              <div className="relative h-14 w-14 shrink-0 rounded-lg bg-gray-100 overflow-hidden border border-gray-100">
                {l.image && (
                  <img src={l.image} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[10px] font-bold rounded-full h-4.5 min-w-4.5 px-1 flex items-center justify-center">
                  {l.qty}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 line-clamp-1">{l.name}</div>
                {l.variantTitle && (
                  <div className="text-[11px] text-gray-500">{l.variantTitle}</div>
                )}
                <div className="text-gray-500 mt-1">Qty: {l.qty}</div>
              </div>
              <div className="font-semibold text-gray-900">
                {formatMoney(l.price * l.qty, currency)}
              </div>
            </li>
          ))}
        </ul>

        {/* Coupon Code Section */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Coupon code (e.g. SAVE10)"
              className="input uppercase text-xs"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={!coupon || pending}
              className="btn-outline shrink-0 text-xs px-3.5"
            >
              Apply
            </button>
          </div>
          {couponMsg && <p className="text-xs text-rose-600 mt-1.5">{couponMsg}</p>}
          {applied && (
            <p className="text-xs text-emerald-700 mt-1.5 flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Coupon &ldquo;{applied}&rdquo; applied
            </p>
          )}
        </div>

        {/* Bill Breakdown */}
        <dl className="space-y-2 text-xs border-t border-gray-100 pt-4">
          <div className="flex justify-between text-gray-600">
            <dt>Price Subtotal</dt>
            <dd className="font-medium text-gray-900">{formatMoney(t.subtotal, currency)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <dt>Coupon Discount</dt>
              <dd>-{formatMoney(discount, currency)}</dd>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <dt>Delivery Charges</dt>
            <dd className="font-medium">
              {shipping ? formatMoney(shipping, currency) : (
                <span className="text-emerald-700 font-semibold uppercase">Free</span>
              )}
            </dd>
          </div>
          {props.tax.enabled && (
            <div className="flex justify-between text-gray-500">
              <dt>
                {props.tax.label} {props.tax.inclusive ? "(Included)" : ""}
              </dt>
              <dd>{formatMoney(t.tax, currency)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-3 text-sm font-bold text-gray-900">
            <dt>Total Amount</dt>
            <dd className="text-base font-bold">{formatMoney(total, currency)}</dd>
          </div>
        </dl>

        {err && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 leading-relaxed">
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || paying || (!props.gateway && !props.codEnabled)}
          className="btn-primary w-full py-3.5 text-sm font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {pending || paying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {paying ? "Waiting for payment…" : "Processing order…"}
            </>
          ) : pm === "cod" ? (
            "Place Order with Cash on Delivery"
          ) : (
            <>
              <Lock className="h-4 w-4" /> Pay {formatMoney(total, currency)}
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 text-center pt-1">
          <Truck className="h-3.5 w-3.5 text-gray-400" />
          <span>{props.estimateText}</span>
        </div>
      </aside>
    </form>
  );
}
