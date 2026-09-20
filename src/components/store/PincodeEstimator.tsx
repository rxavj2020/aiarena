"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store/useStore";
import { MapPin, Truck, CheckCircle, Clock, ShieldCheck } from "lucide-react";
import { formatMoney } from "@/lib/format";

export function PincodeEstimator({ freeAbove = 0, price = 0, codEnabled = true, currency = "INR" }: { freeAbove?: number; price?: number; codEnabled?: boolean; currency?: string }) {
  const { savedPincode, setSavedPincode } = useStore();
  const [pin, setPin] = useState("");
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryDateStr, setDeliveryDateStr] = useState("");

  useEffect(() => {
    if (savedPincode && savedPincode.length === 6) {
      setPin(savedPincode);
      calculateDelivery(savedPincode);
      setChecked(true);
    }
  }, [savedPincode]);

  const calculateDelivery = (pincodeVal: string) => {
    const d = new Date();
    const isFast = ["1", "4", "5", "6"].includes(pincodeVal[0]);
    const daysToAdd = isFast ? 2 : 4;
    d.setDate(d.getDate() + daysToAdd);
    const formatter = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });
    setDeliveryDateStr(formatter.format(d));
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = pin.trim();
    if (!/^\\d{6}$/.test(clean)) {
      setError("Please enter a valid 6-digit PIN code");
      return;
    }
    setSavedPincode(clean);
    calculateDelivery(clean);
    setChecked(true);
  };

  const isFree = freeAbove > 0 && price >= freeAbove;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-700 mb-4">
        <div className="h-7 w-7 rounded-full bg-gray-900 text-white flex items-center justify-center">
          <MapPin className="h-4 w-4" />
        </div>
        Delivery & Services
      </div>

      {!checked ? (
        <form onSubmit={handleCheck} className="flex gap-2">
          <div className="relative flex-1 max-w-[220px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); if (error) setError(null); }} placeholder="Enter PIN code" className="input rounded-full pl-9 text-sm bg-gray-50" />
          </div>
          <button type="submit" className="btn-primary rounded-full px-5 text-sm">Check</button>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-3">
            <span className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" /> Deliver to <b className="font-bold">{savedPincode}</b>
            </span>
            <button type="button" onClick={() => setChecked(false)} className="text-xs font-bold text-[#2874f0] bg-white border px-3 py-1 rounded-full hover:border-gray-900">Change</button>
          </div>

          <div className="grid gap-2.5">
            <div className="flex items-center gap-3 text-sm bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Truck className="h-4 w-4 text-emerald-700" /></div>
              <div className="flex-1">
                <div className="font-bold text-emerald-900 text-xs">Delivery by {deliveryDateStr}</div>
                <div className="text-[11px] text-emerald-700">{isFree ? "FREE Delivery" : freeAbove > 0 ? `Free over ${formatMoney(freeAbove, currency)}` : "Standard delivery"}</div>
              </div>
              {isFree && <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">FREE</span>}
            </div>

            {codEnabled && (
              <div className="flex items-center gap-3 text-xs text-gray-700 bg-white border border-gray-100 rounded-xl p-3">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><CheckCircle className="h-4 w-4 text-blue-600" /></div>
                <span><b>Cash on Delivery</b> available · Pay at doorstep</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-gray-600 bg-white border border-gray-100 rounded-xl p-3">
              <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0"><ShieldCheck className="h-4 w-4 text-gray-600" /></div>
              <span><b>Secure transaction</b> · 7 days return · Buyer protection</span>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-600 font-medium mt-2 bg-rose-50 border border-rose-100 rounded-full px-3 py-1.5 w-fit">{error}</p>}
    </div>
  );
}
