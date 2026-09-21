import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatDate, formatMoney } from "@/lib/format";
import { getOrder } from "@/lib/orders";
import { getTenantSite } from "@/lib/tenant-site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const site = await getTenantSite((await params).slug);
  return site ? { title: `Track order · ${site.name}` } : { title: "Track order" };
}

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

export default async function TenantTrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ n?: string; e?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const site = await getTenantSite(slug);
  if (!site) notFound();
  const settings = await getSettings();

  let found: ReturnType<typeof getOrder> | null = null;
  const searched = Boolean(sp.n && sp.e);
  if (sp.n && sp.e) {
    const o = db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(and(eq(schema.orders.orderNumber, Number(sp.n)), eq(schema.orders.email, sp.e.toLowerCase().trim()), eq(schema.orders.tenantId, site.tenant.id)))
      .get();
    if (o) found = getOrder(o.id);
  }

  const stepIndex = found ? Math.max(0, STATUS_STEPS.indexOf(found.order.status as (typeof STATUS_STEPS)[number])) : -1;

  return (
    <div className="s-container s-section s-narrow">
      <h1 className="s-h1">Track your order</h1>
      {!found ? (
        <>
          <p className="s-note s-mb-3">Enter the order number from your {site.name} confirmation email.</p>
          <form className="s-card s-pad s-track-form">
            <input name="n" placeholder="Order number" defaultValue={sp.n} required className="s-input" inputMode="numeric" />
            <input name="e" type="email" placeholder="Email used at checkout" defaultValue={sp.e} required className="s-input" />
            <button className="s-btn s-btn-primary">Track</button>
            {searched ? <p className="s-error">No order found with those details.</p> : null}
          </form>
        </>
      ) : (
        <div className="s-card s-pad s-mt-3">
          <div className="s-summary-head">
            <div>
              <div className="s-eyebrow">Order</div>
              <h2 className="s-h3">#{found.order.orderNumber}</h2>
            </div>
            <div className="s-right">
              <div className="s-eyebrow">Total</div>
              <b>{formatMoney(found.order.total, settings.currency)}</b>
            </div>
          </div>
          <p className="s-note s-note-inline">Placed {formatDate(found.order.createdAt)} · {found.order.status}</p>

          {stepIndex >= 0 ? (
            <ol className="s-timeline">
              {STATUS_STEPS.map((s, i) => (
                <li key={s} className={i <= stepIndex ? "is-done" : ""}>
                  <span className="s-timeline-dot" />
                  <span className="capitalize">{s}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="s-note">Status: <b className="capitalize">{found.order.status}</b></p>
          )}

          {found.order.trackingNumber ? (
            <p className="s-note s-note-inline">
              Tracking: {found.order.carrier ? `${found.order.carrier} · ` : ""}
              {found.order.trackingUrl ? <a href={found.order.trackingUrl} target="_blank" rel="noopener noreferrer" className="s-link">{found.order.trackingNumber}</a> : found.order.trackingNumber}
            </p>
          ) : null}

          <dl className="s-summary-list s-mt-3">
            {found.items.map((it) => (
              <div key={it.id}>
                <dt>{it.name}{it.variantTitle ? ` · ${it.variantTitle}` : ""} × {it.quantity}</dt>
                <dd>{formatMoney(it.price * it.quantity, settings.currency)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
