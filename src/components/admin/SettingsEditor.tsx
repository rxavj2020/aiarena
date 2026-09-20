"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StoreSettings } from "@/lib/settings";
import { updateSettings } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";

export function SettingsEditor({ settings }: { settings: StoreSettings }) {
  const [s, setS] = useState(settings);
  const [pending, start] = useTransition();
  const toast = useToast(); const router = useRouter();
  const save = () => start(async () => { notify(toast, await updateSettings(s)); router.refresh(); });
  const money = (v: number) => (v / 100).toString();
  return (
    <div>
      <div className="flex justify-end mb-4"><button onClick={save} disabled={pending} className="btn-primary">{pending ? "Saving…" : "Save settings"}</button></div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-3">
          <h3 className="font-semibold">Shipping</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Flat shipping rate (₹)</label><input type="number" value={money(s.shipping.flatRate)} onChange={(e) => setS({ ...s, shipping: { ...s.shipping, flatRate: Math.round(Number(e.target.value) * 100) } })} className="input" /></div>
            <div><label className="label">Free shipping above (₹, 0 = never)</label><input type="number" value={money(s.shipping.freeAbove)} onChange={(e) => setS({ ...s, shipping: { ...s.shipping, freeAbove: Math.round(Number(e.target.value) * 100) } })} className="input" /></div>
          </div>
          <div><label className="label">Delivery estimate text</label><input value={s.shipping.estimateText} onChange={(e) => setS({ ...s, shipping: { ...s.shipping, estimateText: e.target.value } })} className="input" /></div>
          <h3 className="font-semibold pt-3">Cash on Delivery</h3>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.shipping.codEnabled} onChange={(e) => setS({ ...s, shipping: { ...s.shipping, codEnabled: e.target.checked } })} /> Offer Cash on Delivery</label>
          <div><label className="label">COD handling fee (₹)</label><input type="number" value={money(s.shipping.codFee)} onChange={(e) => setS({ ...s, shipping: { ...s.shipping, codFee: Math.round(Number(e.target.value) * 100) } })} className="input" /></div>
        </div>
        <div className="space-y-6">
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold">Tax</h3>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.tax.enabled} onChange={(e) => setS({ ...s, tax: { ...s.tax, enabled: e.target.checked } })} /> Charge tax</label>
            <div className="grid grid-cols-2 gap-3"><div><label className="label">Label</label><input value={s.tax.label} onChange={(e) => setS({ ...s, tax: { ...s.tax, label: e.target.value } })} className="input" /></div><div><label className="label">Rate (%)</label><input type="number" value={s.tax.ratePercent} onChange={(e) => setS({ ...s, tax: { ...s.tax, ratePercent: Number(e.target.value) } })} className="input" /></div></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.tax.inclusive} onChange={(e) => setS({ ...s, tax: { ...s.tax, inclusive: e.target.checked } })} /> Prices include tax (typical for India GST)</label>
          </div>
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold">Notifications</h3>
            <div><label className="label">Send new-order alerts to</label><input value={s.notifications.adminOrderEmail} onChange={(e) => setS({ ...s, notifications: { ...s.notifications, adminOrderEmail: e.target.value } })} className="input" placeholder="owner@yourstore.com (falls back to SMTP plugin setting)" /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.notifications.sendCustomerConfirmation} onChange={(e) => setS({ ...s, notifications: { ...s.notifications, sendCustomerConfirmation: e.target.checked } })} /> Email customers an order confirmation</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.notifications.sendAdminNewOrder} onChange={(e) => setS({ ...s, notifications: { ...s.notifications, sendAdminNewOrder: e.target.checked } })} /> Email me when a new order arrives</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.notifications.sendShippingUpdates} onChange={(e) => setS({ ...s, notifications: { ...s.notifications, sendShippingUpdates: e.target.checked } })} /> Email customers on status / shipping updates</label>
            <p className="text-xs text-gray-500">Requires the Email (SMTP) plugin to be enabled.</p>
          </div>
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold">Regional</h3>
            <div className="grid grid-cols-2 gap-3"><div><label className="label">Currency code</label><input value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value.toUpperCase() })} className="input" /></div><div><label className="label">Locale</label><input value={s.locale} onChange={(e) => setS({ ...s, locale: e.target.value })} className="input" /></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
