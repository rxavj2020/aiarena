"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/db/schema";
import { setOrderStatus, setPaymentStatus, saveOrderNote, resendOrderEmail } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";

export function OrderActions({ order: o }: { order: Order }) {
  const [status, setStatus] = useState<Order["status"]>(o.status);
  const [tracking, setTracking] = useState(o.trackingNumber ?? "");
  const [carrier, setCarrier] = useState(o.carrier ?? "");
  const [url, setUrl] = useState(o.trackingUrl ?? "");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [note, setNote] = useState(o.adminNote ?? "");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => start(async () => { notify(toast, await fn()); router.refresh(); });
  const autoUrl = (c: string, t: string) => {
    const m: Record<string, string> = { delhivery: `https://www.delhivery.com/track/package/${t}`, bluedart: `https://www.bluedart.com/tracking?trackingNo=${t}`, dtdc: `https://www.dtdc.in/tracking.asp?awb=${t}`, ekart: `https://ekartlogistics.com/shipmenttrack/${t}`, xpressbees: `https://www.xpressbees.com/shipment/tracking?awbNo=${t}`, "india post": `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`, shiprocket: `https://shiprocket.co/tracking/${t}` };
    return m[c.toLowerCase()] ?? "";
  };
  return (
    <div className="card p-5 grid md:grid-cols-2 gap-5">
      <div>
        <h2 className="font-semibold mb-3">Fulfilment</h2>
        <label className="label">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as Order["status"])} className="input capitalize">{["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div><label className="label">Carrier</label><input list="carriers" value={carrier} onChange={(e) => { setCarrier(e.target.value); if (tracking) setUrl(autoUrl(e.target.value, tracking) || url); }} className="input" placeholder="Delhivery" /><datalist id="carriers">{["Delhivery", "Bluedart", "DTDC", "Ekart", "Xpressbees", "India Post", "Shiprocket"].map((c) => <option key={c} value={c} />)}</datalist></div>
          <div><label className="label">Tracking number</label><input value={tracking} onChange={(e) => { setTracking(e.target.value); if (carrier) setUrl(autoUrl(carrier, e.target.value) || url); }} className="input" /></div>
        </div>
        <label className="label mt-3">Tracking URL</label><input value={url} onChange={(e) => setUrl(e.target.value)} className="input" placeholder="https://…" />
        <label className="flex items-center gap-2 text-sm mt-3"><input type="checkbox" checked={notifyCustomer} onChange={(e) => setNotifyCustomer(e.target.checked)} /> Email customer about this update</label>
        <button disabled={pending} onClick={() => run(() => setOrderStatus(o.id, status, { trackingNumber: tracking, trackingUrl: url, carrier, notify: notifyCustomer }))} className="btn-primary mt-3 w-full">Update order</button>
      </div>
      <div>
        <h2 className="font-semibold mb-3">Payment & notes</h2>
        <label className="label">Payment status</label>
        <div className="flex flex-wrap gap-1.5">{(["unpaid", "paid", "cod", "failed", "refunded"] as const).map((p) => <button key={p} disabled={pending} onClick={() => run(() => setPaymentStatus(o.id, p))} className={`btn-sm btn border capitalize ${o.paymentStatus === p ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"}`}>{p}</button>)}</div>
        <label className="label mt-4">Internal note (not visible to customer)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="input" />
        <div className="flex gap-2 mt-2">
          <button disabled={pending} onClick={() => run(() => saveOrderNote(o.id, note))} className="btn-outline btn-sm">Save note</button>
          <button disabled={pending} onClick={() => run(() => resendOrderEmail(o.id))} className="btn-outline btn-sm">Resend confirmation email</button>
        </div>
      </div>
    </div>
  );
}
