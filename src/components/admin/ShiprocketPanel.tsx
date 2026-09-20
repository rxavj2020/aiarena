"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { shiprocketCouriers, shiprocketShip, shiprocketCreateOnly, shiprocketTrack, shiprocketCancel } from "@/actions/admin";
import { useToast, notify } from "@/components/ui/Toast";
import { Truck, RefreshCw, Printer, XCircle, Star, Loader2 } from "lucide-react";
import type { Order } from "@/lib/db/schema";

type Courier = { courier_company_id: number; courier_name: string; rate: number; etd: string; estimated_delivery_days: string; rating: number; recommended?: boolean };
type Track = { status: string; edd?: string; activities: { date: string; activity: string; location: string }[] };

export function ShiprocketPanel({ order: o }: { order: Order }) {
  const [couriers, setCouriers] = useState<Courier[] | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast(); const router = useRouter();
  const done = o.status === "delivered" || o.status === "cancelled" || o.status === "refunded";

  const loadCouriers = async () => { setBusy("rates"); const r = await shiprocketCouriers(o.id); setBusy(null); if (r.ok) setCouriers(r.couriers); else toast(r.error, "err"); };
  const ship = (id?: number) => { setBusy("ship"); start(async () => { notify(toast, await shiprocketShip(o.id, id)); setBusy(null); setCouriers(null); router.refresh(); }); };
  const doTrack = async () => { setBusy("track"); const r = await shiprocketTrack(o.id); setBusy(null); if (r.ok) setTrack(r); else toast(r.error, "err"); };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2"><Truck className="h-4 w-4" /> Shiprocket delivery</h2>
        {o.shiprocketOrderId && <span className="text-xs text-gray-500">SR order #{o.shiprocketOrderId} · shipment {o.shiprocketShipmentId}</span>}
      </div>

      {!o.trackingNumber && !done && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={loadCouriers} disabled={!!busy} className="btn-outline btn-sm">{busy === "rates" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Compare couriers</button>
            <button onClick={() => ship()} disabled={!!busy || pending} className="btn-primary btn-sm">{busy === "ship" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />} Ship with recommended courier</button>
            {!o.shiprocketOrderId && <button onClick={() => start(async () => { notify(toast, await shiprocketCreateOnly(o.id)); router.refresh(); })} disabled={pending} className="btn-ghost btn-sm">Create in Shiprocket only</button>}
          </div>
          {couriers && (
            <table className="data"><thead><tr><th>Courier</th><th>Rate</th><th>ETA</th><th>Rating</th><th></th></tr></thead>
              <tbody>{couriers.map((c) => <tr key={c.courier_company_id}><td className="font-medium">{c.courier_name} {c.recommended && <span className="badge bg-green-100 text-green-800 ml-1"><Star className="h-3 w-3 mr-0.5" />recommended</span>}</td><td>₹{c.rate}</td><td>{c.etd || `${c.estimated_delivery_days} days`}</td><td>{c.rating ? c.rating.toFixed(1) : "—"}</td><td className="text-right"><button onClick={() => ship(c.courier_company_id)} disabled={!!busy} className="btn-primary btn-sm">Ship</button></td></tr>)}
              {couriers.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-gray-500">No couriers serviceable for this PIN code / weight</td></tr>}</tbody></table>
          )}
          <p className="text-xs text-gray-500">Ship = create order in Shiprocket → assign AWB → schedule pickup → generate label → mark as shipped & email customer.</p>
        </div>
      )}

      {o.trackingNumber && (
        <div className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-gray-50 p-3"><div className="text-xs text-gray-500">Courier</div><div className="font-medium">{o.carrier}</div></div>
            <div className="rounded-lg bg-gray-50 p-3"><div className="text-xs text-gray-500">AWB</div><div className="font-medium font-mono">{o.trackingNumber}</div></div>
            <div className="rounded-lg bg-gray-50 p-3"><div className="text-xs text-gray-500">Track</div>{o.trackingUrl && <a href={o.trackingUrl} target="_blank" rel="noreferrer" className="underline">Public tracking page</a>}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {o.labelUrl && <a href={o.labelUrl} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><Printer className="h-3.5 w-3.5" /> Shipping label</a>}
            {o.shiprocketOrderId && <button onClick={doTrack} disabled={!!busy} className="btn-outline btn-sm">{busy === "track" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh tracking</button>}
            {o.shiprocketOrderId && !done && <button onClick={() => confirm("Cancel this shipment in Shiprocket?") && start(async () => { notify(toast, await shiprocketCancel(o.id)); router.refresh(); })} disabled={pending} className="btn-ghost btn-sm text-red-600"><XCircle className="h-3.5 w-3.5" /> Cancel shipment</button>}
          </div>
          {track && (
            <div className="rounded-lg border p-3 text-sm">
              <div className="font-medium">{track.status}{track.edd && <span className="text-gray-500 font-normal"> · EDD {track.edd}</span>}</div>
              <ul className="mt-2 space-y-1.5 max-h-48 overflow-auto">{track.activities.map((a, i) => <li key={i} className="text-xs flex gap-3"><span className="text-gray-400 w-32 shrink-0">{a.date}</span><span>{a.activity} <span className="text-gray-400">· {a.location}</span></span></li>)}</ul>
            </div>
          )}
        </div>
      )}
      {done && !o.trackingNumber && <p className="text-sm text-gray-500">Order is {o.status}; nothing to ship.</p>}
    </div>
  );
}
