"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store/useStore";
import { MapPin, Truck, CheckCircle, Clock } from "lucide-react";
import { formatMoney } from "@/lib/format";

export function PincodeEstimator({
  freeAbove = 0,
  price = 0,
  codEnabled = true,
  currency = "INR",
}: {
  freeAbove?: number;
  price?: number;
  codEnabled?: boolean;
  currency?: string;
}) {
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
    // Determine delivery days based on pincode (e.g. 2 to 4 days)
    const d = new Date();
    const isFast = ["1", "4", "5", "6"].includes(pincodeVal[0]); // Metros / major zones
    const daysToAdd = isFast ? 3 : 5;
    d.setDate(d.getDate() + daysToAdd);

    const formatter = new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    setDeliveryDateStr(formatter.format(d));
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = pin.trim();
    if (!/^\d{6}$/.test(clean)) {
      setError("Please enter a valid 6-digit PIN code");
      return;
    }
    setSavedPincode(clean);
    calculateDelivery(clean);
    setChecked(true);
  };

  const isFree = freeAbove > 0 && price >= freeAbove;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
        <MapPin className="h-4 w-4 text-primary" />
        Delivery Options & Services
      </div>

      {!checked ? (
        <form onSubmit={handleCheck} className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ""));
              if (error) setError(null);
            }}
            placeholder="Enter 6-digit PIN code"
            className="input bg-white text-xs py-2 flex-1 max-w-[200px]"
          />
          <button type="submit" className="btn-outline text-xs px-4 py-2 hover:border-gray-900">
            Check
          </button>
        </form>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              Deliver to: <b className="text-gray-900 font-semibold">{savedPincode}</b>
            </span>
            <button
              type="button"
              onClick={() => {
                setChecked(false);
              }}
              className="text-primary hover:underline font-medium"
            >
              Change
            </button>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-gray-200/60 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <Truck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>
                Estimated delivery by <b>{deliveryDateStr}</b>
              </span>
              {isFree ? (
                <span className="badge bg-emerald-100 text-emerald-800 text-[10px] ml-auto">
                  FREE Delivery
                </span>
              ) : freeAbove > 0 ? (
                <span className="text-[11px] text-gray-500 ml-auto">
                  Free over {formatMoney(freeAbove, currency)}
                </span>
              ) : null}
            </div>

            {codEnabled && (
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>Cash on Delivery available</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span>Standard 24h dispatch guarantee</span>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
