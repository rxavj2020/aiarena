"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store/useStore";
import { MapPin, Truck, CheckCircle, Clock, Package } from "lucide-react";
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
    if (!/^\d{6}$/.test(clean)) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }
    setSavedPincode(clean);
    calculateDelivery(clean);
    setChecked(true);
  };

  const isFree = freeAbove > 0 && price >= freeAbove;

  return (
    <div className="bg-white rounded-xl border border-[#e0e0e0] p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="h-8 w-8 rounded-full bg-[#f1f2f4] flex items-center justify-center">
          <Package className="h-4 w-4 text-[#212121]" />
        </div>
        <div>
          <div className="font-bold text-sm text-[#212121]">Delivery Options</div>
          <div className="text-[11px] text-[#878787]">Check availability at your location</div>
        </div>
      </div>

      {!checked ? (
        <form onSubmit={handleCheck} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                if (error) setError(null);
              }}
              placeholder="Enter pincode"
              className="input flex-1 font-mono tracking-widest"
            />
            <button type="submit" className="btn-primary rounded-lg px-5 bg-[#2874f0] shrink-0">
              Check
            </button>
          </div>
          <div className="text-[11px] text-[#878787] flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Enter 6-digit pincode for delivery estimate
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-[#f8f9fb] border border-[#e0e0e0] rounded-xl p-3">
            <div className="flex items-center gap-2 text-sm text-[#212121]">
              <MapPin className="h-4 w-4 text-[#878787]" />
              <span>Deliver to <b className="font-bold">{savedPincode}</b></span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#388e3c] inline-block" />
              <span className="text-xs text-[#388e3c] font-bold">Available</span>
            </div>
            <button type="button" onClick={() => setChecked(false)} className="text-xs font-bold text-[#2874f0] bg-white border border-[#e0e0e0] px-3 py-1 rounded-full hover:border-[#2874f0]">Change</button>
          </div>

          <div className="grid gap-2.5">
            <div className="flex items-start gap-3 text-sm bg-[#e8f5e9] border border-[#c8e6c9] rounded-xl p-3">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-[#c8e6c9]">
                <Truck className="h-4 w-4 text-[#388e3c]" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-[#212121] text-xs">Delivery by {deliveryDateStr}</div>
                <div className="text-[11px] text-[#2e7d32] mt-0.5">
                  {isFree ? "FREE Delivery on this order" : freeAbove > 0 ? `Free delivery over ${formatMoney(freeAbove, currency)}` : "Standard delivery charges apply"}
                </div>
              </div>
              {isFree && <span className="bg-[#388e3c] text-white text-[10px] font-bold px-2 py-1 rounded-full shrink-0">FREE</span>}
            </div>

            {codEnabled && (
              <div className="flex items-center gap-3 text-xs text-[#212121] bg-white border border-[#e0e0e0] rounded-xl p-3">
                <div className="h-8 w-8 rounded-full bg-[#f1f2f4] flex items-center justify-center shrink-0">
                  <CheckCircle className="h-4 w-4 text-[#212121]" />
                </div>
                <span><b>Cash on Delivery</b> available at this pincode</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-xs text-[#212121] bg-white border border-[#e0e0e0] rounded-xl p-3">
              <div className="h-8 w-8 rounded-full bg-[#f1f2f4] flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-[#212121]" />
              </div>
              <span><b>7 days</b> return & exchange · <b>Secure</b> payment</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
