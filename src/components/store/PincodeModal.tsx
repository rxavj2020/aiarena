"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store/useStore";
import { MapPin, X, Truck, CheckCircle, ShieldCheck } from "lucide-react";

export function PincodeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { savedPincode, setSavedPincode } = useStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setPin(savedPincode || "");
      setError(null);
      setSuccess(false);
    }
  }, [open, savedPincode]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    const clean = pin.trim();
    if (!/^\d{6}$/.test(clean)) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }
    setSavedPincode(clean);
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl border border-[#e0e0e0] animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#f0f0f0] p-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#2874f0] text-white flex items-center justify-center">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#212121]">Choose your location</div>
              <div className="text-[11px] text-[#878787]">For accurate delivery estimates</div>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-[#f1f2f4] hover:bg-[#e0e0e0] flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="label">Delivery pincode</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ""));
                    if (error) setError(null);
                    if (success) setSuccess(false);
                  }}
                  placeholder="Enter 6-digit pincode"
                  className="input pr-10 font-mono tracking-widest"
                  autoFocus
                />
                {pin.length === 6 && !error && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#388e3c]" />
                )}
              </div>
              <button type="submit" className="btn-primary rounded-lg px-6 whitespace-nowrap bg-[#2874f0]">
                {success ? "Saved!" : "Apply"}
              </button>
            </div>
            {error && <p className="text-xs text-red-600 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-xs text-[#388e3c] mt-2 bg-[#e8f5e9] border border-[#c8e6c9] rounded-lg px-3 py-2 flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Pincode saved to {pin}</p>}
          </div>

          <div className="rounded-xl bg-[#f8f9fb] border border-[#f0f0f0] p-4 space-y-3">
            <div className="text-xs font-bold text-[#212121]">Why enter pincode?</div>
            <div className="space-y-2.5">
              <div className="flex gap-2.5 text-xs">
                <div className="h-7 w-7 rounded-full bg-white border flex items-center justify-center shrink-0"><Truck className="h-3.5 w-3.5 text-[#2874f0]" /></div>
                <div><div className="font-semibold text-[#212121]">Accurate delivery date</div><div className="text-[#878787] text-[11px]">Know when your order will arrive</div></div>
              </div>
              <div className="flex gap-2.5 text-xs">
                <div className="h-7 w-7 rounded-full bg-white border flex items-center justify-center shrink-0"><CheckCircle className="h-3.5 w-3.5 text-[#388e3c]" /></div>
                <div><div className="font-semibold text-[#212121]">Cash on Delivery</div><div className="text-[#878787] text-[11px]">Check COD availability</div></div>
              </div>
              <div className="flex gap-2.5 text-xs">
                <div className="h-7 w-7 rounded-full bg-white border flex items-center justify-center shrink-0"><ShieldCheck className="h-3.5 w-3.5 text-[#212121]" /></div>
                <div><div className="font-semibold text-[#212121]">Faster checkout</div><div className="text-[#878787] text-[11px]">Saved for next time</div></div>
              </div>
            </div>
          </div>

          {savedPincode && (
            <div className="flex items-center justify-between text-xs bg-[#e8f0fe] border border-[#c2d6ff] rounded-xl p-3">
              <span className="text-[#212121]">Current: <b>{savedPincode}</b></span>
              <button type="button" onClick={() => { setPin(""); setSavedPincode(""); setSuccess(false); }} className="text-[#2874f0] font-bold hover:underline">Clear</button>
            </div>
          )}

          <div className="text-[11px] text-[#878787] text-center pt-2">
            We deliver across 19000+ pincodes in India · Free delivery over ₹999
          </div>
        </form>
      </div>
    </div>
  );
}
