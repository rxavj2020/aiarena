import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { OrderDetail } from "@/components/store/OrderDetail";
import { getOrder } from "@/lib/orders";
export const metadata = { title: "Track order" };
export default async function TrackPage({ searchParams }: { searchParams: Promise<{ n?: string; e?: string }> }) {
  const sp = await searchParams;
  const set = await getSettings();
  let found = null;
  if (sp.n && sp.e) {
    const o = db.select({ id: schema.orders.id }).from(schema.orders).where(and(eq(schema.orders.orderNumber, Number(sp.n)), eq(schema.orders.email, sp.e.toLowerCase().trim()))).get();
    if (o) found = getOrder(o.id);
  }
  return (
    <div className="container-x py-14 max-w-3xl">
      {!found && (
        <>
          <h1 className="font-display text-4xl font-semibold">Track your order</h1>
          <form className="card p-6 mt-6 grid sm:grid-cols-[1fr_1fr_auto] gap-3">
            <input name="n" placeholder="Order number" defaultValue={sp.n} required className="input" />
            <input name="e" type="email" placeholder="Email used at checkout" defaultValue={sp.e} required className="input" />
            <button className="btn-primary">Track</button>
            {sp.n && <p className="text-sm text-red-600 sm:col-span-3">No order found with those details.</p>}
          </form>
        </>
      )}
      {found && <OrderDetail {...found} currency={set.currency} />}
    </div>
  );
}
