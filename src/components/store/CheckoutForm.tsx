"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { placeOrder, validateCoupon } from "@/actions/checkout";
import { formatMoney } from "@/lib/format";
import type { Totals } from "@/lib/cart";
import { Lock, Loader2, ShieldCheck, CheckCircle2, Sparkles, Truck, MapPin, CreditCard, Tag, ChevronRight, Plus, ChevronDown } from "lucide-react";
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
    Razorpay?: new (o: unknown) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
    Cashfree?: (o: { mode: string }) => { checkout: (o: { paymentSessionId: string; redirectTarget: string }) => void };
  }
}

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh","Andaman & Nicobar","Dadra & Nagar Haveli and Daman & Diu","Lakshadweep"];

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
  lines: { key: string; name: string; variantTitle?: string; image?: string; price: number; qty: number }[];
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
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(props.addresses[0]?.id ?? null);
  const [showNewAddrForm, setShowNewAddrForm] = useState(props.addresses.length === 0);

  const [addr, setAddr] = useState<Addr>({
    name: props.addresses[0]?.name ?? props.user?.name ?? "",
    phone: props.addresses[0]?.phone ?? "",
    line1: props.addresses[0]?.line1 ?? "",
    line2: props.addresses[0]?.line2 ?? "",
    city: props.addresses[0]?.city ?? "",
    state: props.addresses[0]?.state ?? "",
    postalCode: props.addresses[0]?.postalCode ?? "",
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

  useEffect(() => {
    if (savedPincode && savedPincode.length === 6 && !addr.postalCode) {
      const detectedState = inferStateFromPin(savedPincode);
      setAddr((prev) => ({ ...prev, postalCode: savedPincode, state: detectedState || prev.state }));
    }
  }, [savedPincode]);

  // When selected address changes, fill form
  useEffect(() => {
    if (selectedAddrId) {
      const a = props.addresses.find((x) => x.id === selectedAddrId);
      if (a) {
        setAddr({ name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, state: a.state, postalCode: a.postalCode, country: a.country });
      }
    }
  }, [selectedAddrId]);

  const t = props.initialTotals;
  const shipping = t.shipping + (pm === "cod" ? props.codFee : 0);
  const total = t.subtotal - discount + shipping + (props.tax.inclusive ? 0 : t.tax);

  const handlePostalCodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    const detected = inferStateFromPin(cleaned);
    setAddr((prev) => ({ ...prev, postalCode: cleaned, state: detected || prev.state }));
  };

  const set = (k: keyof Addr) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAddr({ ...addr, [k]: e.target.value });

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

  const canProceedAddress = addr.name && addr.phone.length >= 10 && addr.line1 && addr.postalCode.length === 6 && addr.city && addr.state && email;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const cleanPhone = addr.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) return setErr("Please enter a valid 10-digit mobile number");

    start(async () => {
      const r = await placeOrder({
        email,
        address: { ...addr, line2: addr.line2 ?? undefined },
        paymentMethod: pm,
        couponCode: applied,
        note,
        saveAddress: save && showNewAddrForm,
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
          handler: async (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            const v = await fetch("/api/payments/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: r.orderId, ...resp }) });
            if (v.ok) router.push(`/checkout/success/${r.orderId}`);
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
    <form onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-6">
      {props.gateway === "razorpay" && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />}
      {props.gateway === "cashfree" && <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" />}

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-[#e0e0e0] p-4 flex items-center gap-2 text-xs font-semibold">
          {[
            { n: 1, label: "Address" },
            { n: 2, label: "Payment" },
            { n: 3, label: "Review" },
          ].map((s, idx) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold transition ${step >= s.n ? "bg-[#212121] text-white" : "bg-[#f1f2f4] text-[#878787]"}`}>
                {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
              </div>
              <span className={`${step >= s.n ? "text-[#212121]" : "text-[#878787]"} hidden sm:inline`}>{s.label}</span>
              {idx < 2 && <div className={`flex-1 h-0.5 mx-2 rounded-full ${step > s.n ? "bg-[#212121]" : "bg-[#f1f2f4]"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Address - Improved flow */}
        <section className={`bg-white rounded-xl border ${step === 1 ? "border-[#212121] shadow-sm" : "border-[#e0e0e0]"} p-5 transition`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base flex items-center gap-2 text-[#212121]">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-[#212121] text-white" : "bg-[#f1f2f4]"}`}>1</span>
              Delivery Address
            </h2>
            {step > 1 && <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-[#2874f0] hover:underline">Change</button>}
          </div>

          {step === 1 ? (
            <>
              <div className="mb-4">
                <label className="label">Email for order updates *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input rounded-lg" />
                {!props.user && <div className="text-[11px] text-[#878787] mt-1">Already have an account? <a href="/login?next=/checkout" className="text-[#2874f0] font-semibold hover:underline">Log in</a> for faster checkout</div>}
              </div>

              {/* Saved addresses - improved selection */}
              {props.addresses.length > 0 && !showNewAddrForm && (
                <div className="mb-5">
                  <div className="text-xs font-bold text-[#212121] mb-3">Select a saved address</div>
                  <div className="grid gap-3">
                    {props.addresses.map((a) => {
                      const isSelected = selectedAddrId === a.id;
                      return (
                        <button
                          type="button"
                          key={a.id}
                          onClick={() => setSelectedAddrId(a.id)}
                          className={`text-left rounded-xl border-2 p-4 transition flex gap-3 ${isSelected ? "border-[#2874f0] bg-[#f0f5ff]" : "border-[#e0e0e0] bg-white hover:border-[#212121]"}`}
                        >
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? "border-[#2874f0] bg-[#2874f0]" : "border-[#e0e0e0]"}`}>
                            {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-[#212121] flex items-center gap-2">
                              {a.label || "Home"} {isSelected && <span className="text-[10px] bg-[#2874f0] text-white px-2 py-0.5 rounded-full">Selected</span>}
                            </div>
                            <div className="text-sm text-[#212121] mt-1 font-medium">{a.name} · {a.phone}</div>
                            <div className="text-xs text-[#878787] mt-1">{a.line1}, {a.line2 ? `${a.line2}, ` : ""}{a.city}, {a.state} - {a.postalCode}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button type="button" onClick={() => setShowNewAddrForm(true)} className="mt-4 w-full border border-dashed border-[#e0e0e0] rounded-xl p-3 text-sm font-semibold text-[#212121] hover:border-[#2874f0] hover:text-[#2874f0] flex items-center justify-center gap-2 bg-[#f8f9fb]">
                    <Plus className="h-4 w-4" /> Use a different address
                  </button>
                </div>
              )}

              {/* New address form - collapsible */}
              {(showNewAddrForm || props.addresses.length === 0) && (
                <div className="space-y-4 animate-fade-in">
                  {props.addresses.length > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#212121]">Add new address</div>
                      <button type="button" onClick={() => { setShowNewAddrForm(false); if (props.addresses[0]) { setSelectedAddrId(props.addresses[0].id); } }} className="text-xs font-bold text-[#878787] hover:text-[#212121] flex items-center gap-1">
                        <ChevronDown className="h-3 w-3 rotate-180" /> Hide
                      </button>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Full name *</label>
                      <input required placeholder="Full name" value={addr.name} onChange={set("name")} className="input rounded-lg" />
                    </div>
                    <div>
                      <label className="label">Mobile number *</label>
                      <input required placeholder="10-digit number" value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="input rounded-lg" inputMode="tel" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Flat, House no., Building, Street *</label>
                      <input required placeholder="House no., Building, Street" value={addr.line1} onChange={set("line1")} className="input rounded-lg" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Landmark (optional)</label>
                      <input placeholder="Landmark" value={addr.line2 ?? ""} onChange={set("line2")} className="input rounded-lg" />
                    </div>
                    <div>
                      <label className="label">Pincode *</label>
                      <input required placeholder="6-digit pincode" value={addr.postalCode} onChange={(e) => handlePostalCodeChange(e.target.value)} className="input rounded-lg font-mono" inputMode="numeric" maxLength={6} />
                    </div>
                    <div>
                      <label className="label">City *</label>
                      <input required placeholder="City" value={addr.city} onChange={set("city")} className="input rounded-lg" />
                    </div>
                    <div>
                      <label className="label">State *</label>
                      <select required value={addr.state} onChange={set("state")} className="input rounded-lg">
                        <option value="">Select State</option>
                        {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Country</label>
                      <input value="India" disabled className="input rounded-lg bg-[#f1f2f4]" />
                    </div>
                  </div>

                  {props.user && (
                    <label className="flex items-center gap-2 text-xs cursor-pointer bg-[#f8f9fb] border border-[#f0f0f0] rounded-xl p-3">
                      <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className="rounded" />
                      <span className="text-[#212121] font-medium">Save this address for future orders</span>
                    </label>
                  )}
                </div>
              )}

              {/* If saved address selected and not showing new form, show summary */}
              {props.addresses.length > 0 && !showNewAddrForm && selectedAddrId && (
                <div className="mt-4 p-3 bg-[#f8f9fb] border border-[#e0e0e0] rounded-xl">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[#878787] mb-1">Delivering to</div>
                  <div className="text-sm font-semibold text-[#212121]">{addr.name} · {addr.phone}</div>
                  <div className="text-xs text-[#878787] mt-1">{addr.line1}, {addr.city}, {addr.state} - {addr.postalCode}</div>
                </div>
              )}

              <div className="mt-4">
                <label className="label">Delivery instructions (optional)</label>
                <textarea placeholder="e.g. Leave with security, call on arrival..." value={note} onChange={(e) => setNote(e.target.value)} className="input rounded-xl text-xs" rows={2} />
              </div>

              <button type="button" disabled={!canProceedAddress} onClick={() => setStep(2)} className="btn-primary w-full mt-5 rounded-full py-3.5 disabled:opacity-40 bg-[#2874f0]">
                Continue to payment <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="text-sm bg-[#f8f9fb] rounded-xl p-4 border border-[#e0e0e0]">
              <div className="font-bold text-[#212121]">{addr.name} · {addr.phone}</div>
              <div className="text-[#878787] text-xs mt-1">{addr.line1}, {addr.line2 ? `${addr.line2}, ` : ""}{addr.city}, {addr.state} - {addr.postalCode}</div>
              <div className="text-xs text-[#878787] mt-1">{email}</div>
            </div>
          )}
        </section>

        {/* Step 2: Payment */}
        <section className={`bg-white rounded-xl border ${step === 2 ? "border-[#212121] shadow-sm" : "border-[#e0e0e0]"} p-5 transition`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base flex items-center gap-2 text-[#212121]">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-[#212121] text-white" : "bg-[#f1f2f4]"}`}>2</span>
              Payment Method
            </h2>
            {step > 2 && <button type="button" onClick={() => setStep(2)} className="text-xs font-bold text-[#2874f0] hover:underline">Change</button>}
          </div>

          {step === 2 ? (
            <div className="space-y-3">
              {props.gateway && (
                <label className={`flex gap-3 rounded-xl border-2 p-4 cursor-pointer transition ${pm === "online" ? "border-[#212121] bg-[#f8f9fb]" : "border-[#e0e0e0] hover:border-[#212121] bg-white"}`}>
                  <input type="radio" name="pm" checked={pm === "online"} onChange={() => setPm("online")} className="mt-1" />
                  <div className="flex-1">
                    <div className="font-bold text-sm flex items-center gap-2 text-[#212121]">
                      <CreditCard className="h-4 w-4" /> Pay Online
                      <span className="bg-[#e8f5e9] text-[#388e3c] text-[10px] px-2 py-0.5 rounded-full border border-[#c8e6c9]">Recommended</span>
                    </div>
                    <div className="text-xs text-[#878787] mt-1">UPI, Cards, NetBanking · Instant confirmation</div>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-[#212121] bg-white rounded-full px-2.5 py-1 w-fit border border-[#e0e0e0]">
                      <ShieldCheck className="h-3 w-3 text-[#388e3c]" /> Secured by {props.gateway === "razorpay" ? "Razorpay" : "Cashfree"}
                    </div>
                  </div>
                  <Lock className="h-4 w-4 text-[#878787]" />
                </label>
              )}

              {props.codEnabled && (
                <label className={`flex gap-3 rounded-xl border-2 p-4 cursor-pointer transition ${pm === "cod" ? "border-[#212121] bg-[#f8f9fb]" : "border-[#e0e0e0] hover:border-[#212121] bg-white"}`}>
                  <input type="radio" name="pm" checked={pm === "cod"} onChange={() => setPm("cod")} className="mt-1" />
                  <div className="flex-1">
                    <div className="font-bold text-sm flex items-center gap-2 text-[#212121]"><Truck className="h-4 w-4" /> Cash on Delivery</div>
                    <div className="text-xs text-[#878787] mt-1">Pay when package arrives {props.codFee ? `· ${formatMoney(props.codFee, currency)} fee` : ""}</div>
                  </div>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-outline rounded-full flex-1 bg-white border-[#e0e0e0]">Back</button>
                <button type="button" onClick={() => setStep(3)} className="btn-primary rounded-full flex-1 bg-[#2874f0]">Review order <ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          ) : step > 2 ? (
            <div className="text-sm bg-[#f8f9fb] rounded-xl p-3 border border-[#e0e0e0]">
              <div className="font-bold capitalize text-[#212121]">{pm === "online" ? "Pay online (UPI / Cards)" : "Cash on Delivery"}</div>
              <div className="text-xs text-[#878787] mt-1">{pm === "online" ? "Secure payment via gateway" : "Pay at doorstep"}</div>
            </div>
          ) : (
            <div className="text-xs text-[#878787]">Complete address to continue</div>
          )}
        </section>

        {step === 3 && (
          <section className="bg-white rounded-xl border border-[#212121] shadow-sm p-5">
            <h2 className="font-bold text-base flex items-center gap-2 mb-4 text-[#212121]">
              <span className="h-6 w-6 rounded-full bg-[#212121] text-white flex items-center justify-center text-xs font-bold">3</span>
              Review & Place Order
            </h2>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {props.lines.map((l) => (
                <div key={l.key} className="flex gap-3 text-xs border-b border-[#f0f0f0] pb-3 last:border-0">
                  <div className="h-14 w-14 rounded-xl bg-[#f8f9fb] overflow-hidden border border-[#f0f0f0] shrink-0">
                    {l.image && <img src={l.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-clamp-1 text-[#212121]">{l.name}</div>
                    {l.variantTitle && <div className="text-[11px] text-[#878787]">{l.variantTitle}</div>}
                    <div className="text-[#878787]">Qty: {l.qty}</div>
                  </div>
                  <div className="font-bold text-[#212121]">{formatMoney(l.price * l.qty, currency)}</div>
                </div>
              ))}
            </div>

            {err && <div className="mt-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{err}</div>}

            <button type="submit" disabled={pending || paying} className="btn-primary w-full mt-5 py-3.5 rounded-full font-bold shadow-sm flex items-center justify-center gap-2 bg-[#2874f0]">
              {pending || paying ? <><Loader2 className="h-4 w-4 animate-spin" /> {paying ? "Processing payment..." : "Placing order..."}</> : pm === "cod" ? "Place order · Cash on Delivery" : <><Lock className="h-4 w-4" /> Pay {formatMoney(total, currency)}</>}
            </button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#878787]">
              <Truck className="h-3.5 w-3.5" /> {props.estimateText} · <ShieldCheck className="h-3.5 w-3.5" /> Buyer protection
            </div>
          </section>
        )}
      </div>

      {/* Summary with fixed coupon UI */}
      <aside className="bg-white rounded-xl border border-[#e0e0e0] p-5 h-fit lg:sticky lg:top-[88px] shadow-sm">
        <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3 mb-4">
          <h2 className="font-bold text-sm text-[#212121]">Order Summary</h2>
          <span className="text-xs bg-[#f1f2f4] px-2.5 py-1 rounded-full font-medium text-[#212121]">{props.lines.reduce((a, b) => a + b.qty, 0)} items</span>
        </div>

        {discount > 0 && (
          <div className="bg-[#e8f5e9] border border-[#c8e6c9] text-[#2e7d32] rounded-xl p-3 text-xs flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-[#388e3c]" />
            <span>🎉 Saving <b>{formatMoney(discount, currency)}</b> on this order!</span>
          </div>
        )}

        {/* Fixed coupon UI - no icon mixing */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-[#f1f2f4] flex items-center justify-center">
              <Tag className="h-3.5 w-3.5 text-[#212121]" />
            </div>
            <span className="text-xs font-bold text-[#212121]">Apply Coupon</span>
          </div>
          <div className="flex gap-2">
            <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Enter coupon code" className="input rounded-lg flex-1 text-xs tracking-widest font-mono" />
            <button type="button" onClick={applyCoupon} disabled={!coupon || pending} className="btn-primary rounded-lg text-xs px-5 bg-[#2874f0] shrink-0">Apply</button>
          </div>
          {couponMsg && <p className="text-xs text-red-600 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{couponMsg}</p>}
          {applied && <p className="text-xs text-[#388e3c] mt-2 bg-[#e8f5e9] border border-[#c8e6c9] rounded-lg px-3 py-2 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> <b>{applied}</b> applied · You saved {formatMoney(discount, currency)}</p>}
        </div>

        <dl className="space-y-2.5 text-xs border-t border-[#f0f0f0] pt-4">
          <div className="flex justify-between text-[#878787]"><dt>Subtotal</dt><dd className="font-medium text-[#212121]">{formatMoney(t.subtotal, currency)}</dd></div>
          {discount > 0 && <div className="flex justify-between text-[#388e3c] font-bold"><dt>Discount</dt><dd>-{formatMoney(discount, currency)}</dd></div>}
          <div className="flex justify-between text-[#878787]"><dt>Delivery</dt><dd className="font-medium">{shipping ? formatMoney(shipping, currency) : <span className="text-[#388e3c] font-bold">FREE</span>}</dd></div>
          {props.tax.enabled && <div className="flex justify-between text-[#878787]"><dt>{props.tax.label} {props.tax.inclusive ? "(incl.)" : ""}</dt><dd>{formatMoney(t.tax, currency)}</dd></div>}
          <div className="flex justify-between border-t border-dashed border-[#e0e0e0] pt-3 text-sm font-bold text-[#212121]"><dt>Total</dt><dd className="text-base">{formatMoney(total, currency)}</dd></div>
        </dl>

        <div className="mt-4 bg-[#f8f9fb] rounded-xl p-3 text-[11px] text-[#878787] border border-[#f0f0f0]">
          <div className="font-bold text-[#212121] mb-1 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Secure checkout</div>
          Your payment information is encrypted and secure. We never store card details.
        </div>
      </aside>
    </form>
  );
}
