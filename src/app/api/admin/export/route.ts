import { getSession } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";

const csv = (rows: (string | number | null | undefined)[][]) => rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

export async function GET(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "admin") return new Response("Unauthorized", { status: 401 });
  const type = new URL(req.url).searchParams.get("type");
  let body = "", name = "export.csv";
  if (type === "orders") {
    const rows = db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).all();
    body = csv([["Order", "Date", "Customer", "Email", "Phone", "City", "State", "PIN", "Status", "Payment", "Provider", "Ref", "Subtotal", "Discount", "Shipping", "Tax", "Total", "Coupon"], ...rows.map((o) => [o.orderNumber, o.createdAt, o.shippingAddress.name, o.email, o.phone, o.shippingAddress.city, o.shippingAddress.state, o.shippingAddress.postalCode, o.status, o.paymentStatus, o.paymentProvider, o.paymentRef, o.subtotal / 100, o.discount / 100, o.shipping / 100, o.tax / 100, o.total / 100, o.couponCode])]);
    name = "orders.csv";
  } else if (type === "products") {
    const rows = db.select().from(schema.products).all();
    body = csv([["ID", "Name", "Slug", "SKU", "Price", "Compare at", "Stock", "Status", "Featured", "Category", "Tags"], ...rows.map((p) => [p.id, p.name, p.slug, p.sku, p.price / 100, p.compareAtPrice ? p.compareAtPrice / 100 : "", p.stock, p.status, p.featured ? "yes" : "no", p.categoryId, p.tags.join("|")])]);
    name = "products.csv";
  } else if (type === "customers") {
    const rows = db.select().from(schema.users).all();
    body = csv([["Name", "Email", "Phone", "Role", "Joined"], ...rows.map((u) => [u.name, u.email, u.phone, u.role, u.createdAt])]);
    name = "customers.csv";
  } else if (type === "subscribers") {
    const rows = db.select().from(schema.subscribers).all();
    body = csv([["Email", "Subscribed"], ...rows.map((u) => [u.email, u.createdAt])]);
    name = "subscribers.csv";
  }
  return new Response(body, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="${name}"` } });
}
