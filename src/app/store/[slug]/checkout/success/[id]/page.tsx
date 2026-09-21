import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, PackageSearch } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatDate, formatMoney } from "@/lib/format";
import { getTenantSite, siteHref } from "@/lib/tenant-site";

export const dynamic = "force-dynamic";

export default async function TenantOrderSuccessPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const site = await getTenantSite(slug);
  if (!site) notFound();
  const order = db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.id, id), eq(schema.orders.tenantId, site.tenant.id)))
    .get();
  if (!order) notFound();
  const items = db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id)).all();
  const settings = await getSettings();
  const base = site.basePath;

  return (
    <div className="s-container s-section s-narrow">
      <div className="s-card s-pad s-success">
        <span className="s-success-icon"><CheckCircle2 className="h-7 w-7" /></span>
        <h1 className="s-h1">Thank you{order.shippingAddress?.name ? `, ${order.shippingAddress.name.split(" ")[0]}` : ""}!</h1>
        <p className="s-note">
          Your order <b>#{order.orderNumber}</b> was placed on {formatDate(order.createdAt)}. A confirmation was sent to {order.email}.
        </p>

        <dl className="s-summary-list s-mt-3">
          {items.map((it) => (
            <div key={it.id}>
              <dt>{it.name}{it.variantTitle ? ` · ${it.variantTitle}` : ""} × {it.quantity}</dt>
              <dd>{formatMoney(it.price * it.quantity, settings.currency)}</dd>
            </div>
          ))}
          <div className="s-summary-total"><dt>Total</dt><dd>{formatMoney(order.total, settings.currency)}</dd></div>
        </dl>

        <div className="s-hero-actions s-mt-3">
          <Link href={siteHref(base, `/track?n=${order.orderNumber}&e=${encodeURIComponent(order.email)}`)} className="s-btn s-btn-primary">
            <PackageSearch className="h-4 w-4" /> Track order
          </Link>
          <Link href={siteHref(base, "/shop")} className="s-btn s-btn-outline">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
