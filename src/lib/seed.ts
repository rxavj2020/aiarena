import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { id, slugify } from "@/lib/utils";

const img = (seed: string, w = 900, h = 900) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export function isSeeded() {
  return (db.select({ n: sql<number>`count(*)` }).from(schema.users).get()?.n ?? 0) > 0;
}

export async function seed(opts?: { adminEmail?: string; adminPassword?: string }) {
  const adminEmail = opts?.adminEmail ?? process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = opts?.adminPassword ?? process.env.ADMIN_PASSWORD ?? "admin1234";
  const pw = await bcrypt.hash(adminPassword, 10);
  db.insert(schema.users).values({ id: id("usr_"), email: adminEmail, passwordHash: pw, name: "Store Admin", role: "admin" }).onConflictDoNothing().run();
  const demoPw = await bcrypt.hash("customer1234", 10);
  const customerId = id("usr_");
  db.insert(schema.users).values({ id: customerId, email: "customer@example.com", passwordHash: demoPw, name: "Priya Sharma", phone: "+91 98765 12345", role: "customer" }).onConflictDoNothing().run();

  const cats = [
    { name: "Home & Living", desc: "Ceramics, textiles and decor for a calmer home.", featured: true },
    { name: "Kitchen", desc: "Tools and tableware that make cooking a joy.", featured: true },
    { name: "Wellness", desc: "Self-care essentials, from teas to candles.", featured: true },
    { name: "Accessories", desc: "Bags, wallets and everyday carry.", featured: true },
    { name: "Stationery", desc: "Notebooks, pens and desk goods.", featured: false },
  ].map((c, i) => ({ id: id("cat_"), name: c.name, slug: slugify(c.name), description: c.desc, image: img("cat" + i, 800, 600), sortOrder: i, featured: c.featured }));
  db.insert(schema.categories).values(cats).onConflictDoNothing().run();
  const cat = (n: string) => cats.find((c) => c.name === n)!.id;

  type P = { name: string; cat: string; price: number; compare?: number; stock: number; short: string; tags: string[]; featured?: boolean; options?: { name: string; values: string[] }[] };
  const items: P[] = [
    { name: "Stoneware Dinner Plate Set", cat: "Kitchen", price: 249900, compare: 319900, stock: 40, short: "Set of 4 hand-glazed stoneware plates, dishwasher safe.", tags: ["ceramic", "tableware", "gift"], featured: true, options: [{ name: "Colour", values: ["Sand", "Slate", "Moss"] }] },
    { name: "Linen Throw Blanket", cat: "Home & Living", price: 349900, compare: 429900, stock: 25, short: "100% European flax linen, stonewashed for softness.", tags: ["linen", "bedroom"], featured: true, options: [{ name: "Colour", values: ["Natural", "Terracotta", "Indigo"] }] },
    { name: "Soy Wax Candle — Cedar & Amber", cat: "Wellness", price: 89900, stock: 120, short: "45-hour burn, cotton wick, hand-poured in small batches.", tags: ["candle", "gift", "fragrance"], featured: true },
    { name: "Leather Card Wallet", cat: "Accessories", price: 149900, compare: 189900, stock: 60, short: "Full-grain vegetable-tanned leather, ages beautifully.", tags: ["leather", "wallet", "gift"], featured: true, options: [{ name: "Colour", values: ["Tan", "Black"] }] },
    { name: "Ceramic Pour-Over Coffee Set", cat: "Kitchen", price: 279900, stock: 18, short: "Dripper, server and two cups for the perfect slow brew.", tags: ["coffee", "ceramic"], featured: true },
    { name: "Organic Herbal Tea Sampler", cat: "Wellness", price: 69900, stock: 200, short: "Six caffeine-free blends, 30 pyramid bags.", tags: ["tea", "organic", "gift"] },
    { name: "Canvas Weekender Bag", cat: "Accessories", price: 429900, compare: 499900, stock: 14, short: "Waxed canvas with leather trims, fits 3 days of travel.", tags: ["bag", "travel"], featured: true, options: [{ name: "Colour", values: ["Olive", "Navy"] }] },
    { name: "Hardcover Dotted Notebook A5", cat: "Stationery", price: 59900, stock: 300, short: "192 pages of 120gsm paper, lay-flat binding.", tags: ["notebook", "desk"], options: [{ name: "Cover", values: ["Charcoal", "Forest", "Clay"] }] },
    { name: "Brass Desk Lamp", cat: "Home & Living", price: 599900, compare: 699900, stock: 9, short: "Solid brass with a warm 2700K dimmable LED.", tags: ["lighting", "desk"], featured: true },
    { name: "Bamboo Cutting Board Trio", cat: "Kitchen", price: 129900, stock: 55, short: "Three sizes of sustainably sourced bamboo boards.", tags: ["bamboo", "kitchen"] },
    { name: "Aromatherapy Diffuser", cat: "Wellness", price: 199900, compare: 249900, stock: 35, short: "Ultrasonic, 300ml, whisper-quiet with 7 light modes.", tags: ["diffuser", "wellness"] },
    { name: "Wool Felt Laptop Sleeve", cat: "Accessories", price: 119900, stock: 70, short: "Merino wool felt with a leather closure strap.", tags: ["laptop", "felt"], options: [{ name: "Size", values: ['13"', '14"', '16"'] }] },
    { name: "Fountain Pen — Brushed Steel", cat: "Stationery", price: 249900, stock: 22, short: "Medium steel nib, cartridge/converter, gift boxed.", tags: ["pen", "gift"] },
    { name: "Handwoven Cotton Cushion Cover", cat: "Home & Living", price: 79900, stock: 90, short: "45×45cm, hand-loomed cotton with hidden zip.", tags: ["cushion", "cotton"], options: [{ name: "Pattern", values: ["Stripe", "Check", "Solid"] }] },
    { name: "Cast Iron Skillet 26cm", cat: "Kitchen", price: 299900, compare: 359900, stock: 30, short: "Pre-seasoned, oven safe to 260°C, lasts a lifetime.", tags: ["cast iron", "cookware"], featured: true },
    { name: "Yoga Mat — Natural Rubber", cat: "Wellness", price: 349900, stock: 40, short: "4mm natural tree rubber, superb grip, 183×61cm.", tags: ["yoga", "fitness"], options: [{ name: "Colour", values: ["Sage", "Plum", "Charcoal"] }] },
  ];

  const descFor = (p: P) =>
    `<p>${p.short}</p><p>Designed to be used every day and loved for years, the <strong>${p.name}</strong> is part of our considered collection of ${p.cat.toLowerCase()} goods. We work with small workshops and choose materials that age gracefully.</p><h3>Details</h3><ul><li>Responsibly sourced materials</li><li>Ships in plastic-free packaging</li><li>Covered by our 7-day easy returns</li></ul>`;

  const reviewers = ["Ananya R.", "Rahul M.", "Kavya S.", "Arjun P.", "Meera K.", "Dev T."];
  const reviewBodies = ["Exactly as pictured, quality is excellent.", "Fast delivery and beautifully packaged. Would buy again.", "Great value for the price. Very happy.", "Gifted this and they loved it!", "Solid build, feels premium.", "Good, though slightly smaller than I expected."];

  let i = 0;
  for (const p of items) {
    const pid = id("prd_");
    const slug = slugify(p.name);
    db.insert(schema.products)
      .values({
        id: pid,
        name: p.name,
        slug,
        description: descFor(p),
        shortDescription: p.short,
        price: p.price,
        compareAtPrice: p.compare,
        sku: `SKU-${1000 + i}`,
        stock: p.stock,
        images: [img(slug + "-1"), img(slug + "-2"), img(slug + "-3")],
        categoryId: cat(p.cat),
        featured: !!p.featured,
        tags: p.tags,
        options: p.options ?? [],
        status: "active",
        createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
      })
      .onConflictDoNothing()
      .run();
    if (p.options?.length) {
      const per = Math.floor(p.stock / p.options[0].values.length);
      db.insert(schema.variants)
        .values(p.options[0].values.map((v) => ({ id: id("var_"), productId: pid, title: v, optionValues: { [p.options![0].name]: v }, stock: per, sku: `SKU-${1000 + i}-${slugify(v).toUpperCase()}` })))
        .run();
    }
    const nR = 2 + (i % 4);
    for (let r = 0; r < nR; r++) {
      db.insert(schema.reviews).values({ id: id("rev_"), productId: pid, authorName: reviewers[(i + r) % reviewers.length], rating: 4 + ((i + r) % 2), body: reviewBodies[(i + r) % reviewBodies.length], approved: true, createdAt: new Date(Date.now() - r * 86400000 * 5).toISOString() }).run();
    }
    i++;
  }

  db.insert(schema.coupons)
    .values([
      { id: id("cpn_"), code: "WELCOME10", type: "percent", value: 10, minOrder: 50000, active: true },
      { id: id("cpn_"), code: "FLAT200", type: "fixed", value: 20000, minOrder: 150000, active: true },
      { id: id("cpn_"), code: "FREESHIP", type: "free_shipping", value: 0, minOrder: 0, active: true },
    ])
    .onConflictDoNothing()
    .run();

  db.insert(schema.pages)
    .values([
      { id: id("pg_"), slug: "about", title: "About us", content: "<p>We started Aurelia with a simple idea: everyday objects should be beautiful, durable and fairly made. We partner with artisans and small manufacturers across India to bring you goods that last.</p><p>Every product is tested by our team before it earns a place in the collection.</p>" },
      { id: id("pg_"), slug: "shipping-returns", title: "Shipping & Returns", content: "<h3>Shipping</h3><p>Orders ship within 24 hours on business days. Standard delivery takes 3–6 business days across India. Free shipping on orders above ₹999.</p><h3>Returns</h3><p>Not happy? Return any unused item within 7 days of delivery for a full refund. Contact support to start a return.</p>" },
      { id: id("pg_"), slug: "privacy-policy", title: "Privacy Policy", content: "<p>We only collect the information needed to process your orders and improve your experience. We never sell your data. Payment details are handled by our PCI-DSS compliant payment partners and never touch our servers.</p>" },
      { id: id("pg_"), slug: "terms", title: "Terms of Service", content: "<p>By using this website you agree to these terms. Prices are inclusive of GST unless stated. We reserve the right to cancel orders in case of pricing errors or stock unavailability, with a full refund.</p>" },
      { id: id("pg_"), slug: "faq", title: "FAQ", content: "<h3>Do you ship internationally?</h3><p>Currently we ship within India only.</p><h3>Can I change my order?</h3><p>Contact us within 2 hours of placing your order and we'll do our best.</p><h3>Is Cash on Delivery available?</h3><p>Yes, COD is available on most pincodes with a small handling fee.</p>" },
    ])
    .onConflictDoNothing()
    .run();

  // Sample orders for the dashboard
  const prods = db.select().from(schema.products).limit(6).all();
  const statuses: schema.Order["status"][] = ["delivered", "shipped", "processing", "confirmed", "pending", "delivered", "cancelled", "delivered"];
  for (let k = 0; k < 8; k++) {
    const oid = id("ord_");
    const chosen = [prods[k % prods.length], prods[(k + 2) % prods.length]];
    const subtotal = chosen.reduce((a, p) => a + p.price, 0);
    const shipping = subtotal >= 99900 ? 0 : 7900;
    const status = statuses[k];
    db.insert(schema.orders)
      .values({
        id: oid,
        orderNumber: 1001 + k,
        userId: customerId,
        email: "customer@example.com",
        phone: "+91 98765 12345",
        status,
        paymentStatus: status === "cancelled" ? "refunded" : status === "pending" ? "cod" : "paid",
        paymentProvider: status === "pending" ? "cod" : "razorpay",
        paymentRef: status === "pending" ? null : "pay_demo" + (1000 + k),
        subtotal,
        shipping,
        tax: Math.round(subtotal - subtotal / 1.18),
        total: subtotal + shipping,
        shippingAddress: { name: "Priya Sharma", phone: "+91 98765 12345", line1: "42 Lavelle Road", line2: "Apt 3B", city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "IN" },
        trackingNumber: status === "shipped" || status === "delivered" ? "DL" + (48213000 + k) : null,
        carrier: status === "shipped" || status === "delivered" ? "Delhivery" : null,
        createdAt: new Date(Date.now() - k * 86400000 * 2.5).toISOString(),
      })
      .run();
    db.insert(schema.orderItems).values(chosen.map((p) => ({ id: id("oi_"), orderId: oid, productId: p.id, name: p.name, sku: p.sku, image: p.images[0], price: p.price, quantity: 1 }))).run();
    db.insert(schema.orderEvents).values({ id: id("evt_"), orderId: oid, type: "created", message: "Order placed" }).run();
  }
  return { adminEmail, adminPassword };
}
