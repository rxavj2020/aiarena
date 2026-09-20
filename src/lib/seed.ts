import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { id, slugify } from "@/lib/utils";

const img = (seed: string, w = 900, h = 900) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
// For clothing/jewellery use more relevant placeholder via picsum but seed names help
const fashionImg = (seed: string, w = 900, h = 900) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

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

  // Clothing & Jewellery focused categories - Flipkart style
  const catsRaw = [
    { name: "Clothing", desc: "Trendy ethnic & western wear for men, women & kids.", featured: true },
    { name: "Jewellery", desc: "Gold-plated, silver, temple & fashion jewellery.", featured: true },
    { name: "Women's Clothing", desc: "Sarees, kurtis, dresses, tops & more.", featured: true, parent: "Clothing" },
    { name: "Men's Clothing", desc: "Shirts, t-shirts, kurtas & ethnic wear.", featured: true, parent: "Clothing" },
    { name: "Kids Clothing", desc: "Adorable outfits for kids.", featured: false, parent: "Clothing" },
    { name: "Necklaces", desc: "Chokers, long sets, temple jewellery.", featured: true, parent: "Jewellery" },
    { name: "Earrings", desc: "Jhumkas, studs, chandbalis & more.", featured: true, parent: "Jewellery" },
    { name: "Rings", desc: "Gold-plated, silver & adjustable rings.", featured: true, parent: "Jewellery" },
    { name: "Bangles & Bracelets", desc: "Bangles, kadas & bracelets.", featured: true, parent: "Jewellery" },
    { name: "Bridal Collection", desc: "Complete bridal jewellery sets.", featured: true, parent: "Jewellery" },
  ];

  // First create parent cats
  const catMap = new Map<string, { id: string; name: string; slug: string }>();
  const parentCats = catsRaw.filter(c => !c.parent);
  const parentInserts = parentCats.map((c, i) => {
    const cid = id("cat_");
    catMap.set(c.name, { id: cid, name: c.name, slug: slugify(c.name) });
    return { id: cid, name: c.name, slug: slugify(c.name), description: c.desc, image: fashionImg("cat-" + slugify(c.name), 800, 600), sortOrder: i, featured: c.featured, parentId: null as string | null };
  });
  db.insert(schema.categories).values(parentInserts).onConflictDoNothing().run();

  const childCats = catsRaw.filter(c => c.parent);
  const childInserts = childCats.map((c, i) => {
    const parent = catMap.get(c.parent!) ?? parentInserts.find(p => p.name === c.parent);
    const cid = id("cat_");
    catMap.set(c.name, { id: cid, name: c.name, slug: slugify(c.name) });
    return { id: cid, name: c.name, slug: slugify(c.name), description: c.desc, image: fashionImg("cat-" + slugify(c.name), 800, 600), sortOrder: 10 + i, featured: c.featured, parentId: parent?.id ?? null };
  });
  if (childInserts.length) db.insert(schema.categories).values(childInserts).onConflictDoNothing().run();

  const allCats = [...parentInserts, ...childInserts];
  const cat = (n: string) => catMap.get(n)?.id ?? allCats.find(c => c.name === n)?.id ?? allCats[0].id;

  type P = { name: string; cat: string; price: number; compare?: number; stock: number; short: string; tags: string[]; featured?: boolean; options?: { name: string; values: string[] }[] };
  const items: P[] = [
    // Clothing
    { name: "Banarasi Silk Saree - Royal Blue", cat: "Women's Clothing", price: 499900, compare: 799900, stock: 15, short: "Pure Banarasi silk with zari work, blouse included.", tags: ["saree", "silk", "ethnic", "wedding"], featured: true, options: [{ name: "Colour", values: ["Royal Blue", "Maroon", "Emerald"] }] },
    { name: "Embroidered Anarkali Kurta Set", cat: "Women's Clothing", price: 249900, compare: 349900, stock: 30, short: "Georgette anarkali with dupatta, perfect for festive.", tags: ["kurta", "anarkali", "ethnic"], featured: true, options: [{ name: "Size", values: ["S", "M", "L", "XL"] }] },
    { name: "Men's Linen Kurta Pajama Set", cat: "Men's Clothing", price: 199900, compare: 299900, stock: 25, short: "Breathable linen kurta pajama for festive & casual.", tags: ["kurta", "mens", "linen"], featured: true, options: [{ name: "Size", values: ["M", "L", "XL", "XXL"] }] },
    { name: "Designer Lehenga Choli - Blush Pink", cat: "Women's Clothing", price: 699900, compare: 999900, stock: 8, short: "Heavy embroidered lehenga choli for weddings.", tags: ["lehenga", "bridal", "wedding"], featured: true, options: [{ name: "Size", values: ["Free Size"] }] },
    { name: "Cotton Printed Dress - Summer", cat: "Women's Clothing", price: 129900, compare: 199900, stock: 45, short: "Lightweight cotton dress, perfect for daily wear.", tags: ["dress", "cotton", "casual"], featured: false, options: [{ name: "Size", values: ["S", "M", "L"] }] },
    { name: "Men's Printed Shirt - Festive", cat: "Men's Clothing", price: 149900, stock: 40, short: "Slim fit printed shirt, premium cotton.", tags: ["shirt", "mens", "festive"], featured: false, options: [{ name: "Size", values: ["M", "L", "XL"] }] },
    { name: "Kids Ethnic Lehenga - Yellow", cat: "Kids Clothing", price: 179900, compare: 249900, stock: 20, short: "Cute lehenga choli for kids 4-10 years.", tags: ["kids", "lehenga", "ethnic"], featured: true, options: [{ name: "Age", values: ["4-5Y", "6-7Y", "8-10Y"] }] },
    { name: "Women's Palazzo Set - Cotton", cat: "Women's Clothing", price: 99900, compare: 149900, stock: 60, short: "Kurta palazzo set, office & casual wear.", tags: ["palazzo", "cotton", "office"], featured: false },

    // Jewellery
    { name: "Temple Gold Necklace Set - Lakshmi", cat: "Necklaces", price: 349900, compare: 499900, stock: 12, short: "Antique temple jewellery with Lakshmi pendant, earrings included.", tags: ["temple", "gold", "necklace", "bridal"], featured: true },
    { name: "Kundan Choker Set - Emerald", cat: "Necklaces", price: 299900, compare: 459900, stock: 18, short: "Kundan choker with emerald stones, perfect for weddings.", tags: ["kundan", "choker", "emerald"], featured: true },
    { name: "Silver Oxidized Jhumka Earrings", cat: "Earrings", price: 59900, compare: 99900, stock: 80, short: "Oxidized silver jhumkas, lightweight & trendy.", tags: ["jhumka", "silver", "oxidized", "earrings"], featured: true, options: [{ name: "Finish", values: ["Silver", "Golden"] }] },
    { name: "Chandbali Earrings - Pearl", cat: "Earrings", price: 89900, compare: 129900, stock: 50, short: "Pearl chandbali with kundan work, festive ready.", tags: ["chandbali", "pearl", "earrings"], featured: true },
    { name: "Gold Plated Rings Combo - 3 Pcs", cat: "Rings", price: 79900, compare: 129900, stock: 100, short: "Adjustable gold plated rings combo for daily wear.", tags: ["rings", "gold", "combo"], featured: false },
    { name: "Bridal Jewellery Set - Full", cat: "Bridal Collection", price: 899900, compare: 1499900, stock: 5, short: "Complete bridal set: necklace, earrings, maang tikka, bangles.", tags: ["bridal", "wedding", "full set"], featured: true },
    { name: "Kada Bangles Pair - Gold Plated", cat: "Bangles & Bracelets", price: 129900, compare: 199900, stock: 35, short: "Traditional kada bangles, gold plated with stones.", tags: ["bangles", "kada", "gold"], featured: true, options: [{ name: "Size", values: ["2.4", "2.6", "2.8"] }] },
    { name: "Maang Tikka - Kundan Pearl", cat: "Bridal Collection", price: 49900, compare: 79900, stock: 70, short: "Kundan maang tikka with pearls, wedding essential.", tags: ["maang tikka", "kundan", "bridal"], featured: false },
    { name: "Nose Ring - Nath - Maharashtrian", cat: "Rings", price: 39900, compare: 69900, stock: 90, short: "Traditional Maharashtrian nath with pearls.", tags: ["nath", "nose ring", "traditional"], featured: false },
    { name: "Anklets - Silver Plated - Pair", cat: "Bangles & Bracelets", price: 69900, compare: 99900, stock: 55, short: "Silver plated anklets with ghungroo, daily wear.", tags: ["anklets", "silver", "payal"], featured: false },
  ];

  const descFor = (p: P) =>
    `<p>${p.short}</p><p>Designed for modern celebrations, the <strong>${p.name}</strong> brings together traditional craftsmanship and contemporary style. Each piece is handcrafted by artisans and checked for quality, perfect for clothing & jewellery lovers who value authenticity.</p><h3>Details</h3><ul><li>Premium fabric / 1-year plating warranty for jewellery</li><li>Comes in beautiful gift-ready packaging</li><li>Free shipping over ₹999 · 7-day easy returns · Exchange available for jewellery</li><li>Flipkart Assured quality</li></ul>`;

  const reviewers = ["Ananya R.", "Rahul M.", "Kavya S.", "Arjun P.", "Meera K.", "Dev T.", "Sneha P.", "Amit K."];
  const reviewBodies = [
    "Absolutely loved it! Perfect for wedding function. Quality is excellent.",
    "Fast delivery and beautifully packaged. Would buy again for festivals.",
    "Great value for the price. Looks exactly like picture, very happy.",
    "Gifted this and they loved it! Perfect for Diwali.",
    "Solid build, feels premium. Got many compliments!",
    "Good, though slightly different shade but still beautiful.",
    "Perfect fit and fabric is amazing. Highly recommend for ethnic wear.",
    "Jewellery is lightweight and looks real gold. Loved it!",
  ];

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
        images: [fashionImg(slug + "-1"), fashionImg(slug + "-2"), fashionImg(slug + "-3")],
        categoryId: cat(p.cat),
        featured: !!p.featured,
        tags: p.tags,
        options: p.options ?? [],
        status: "active",
        createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
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
      { id: id("cpn_"), code: "FESTIVE30", type: "percent", value: 30, minOrder: 199900, active: true },
      { id: id("cpn_"), code: "FLAT200", type: "fixed", value: 20000, minOrder: 150000, active: true },
      { id: id("cpn_"), code: "FREESHIP", type: "free_shipping", value: 0, minOrder: 0, active: true },
    ])
    .onConflictDoNothing()
    .run();

  db.insert(schema.pages)
    .values([
      { id: id("pg_"), slug: "about", title: "About us", content: "<p>We started Aurelia with a simple idea: clothing & jewellery should be beautiful, durable and fairly made. We partner with artisans across India to bring you authentic Banarasi sarees, Kundan jewellery, and everyday ethnic wear that celebrates our culture.</p><p>Every product is tested by our team before it earns a place in the collection. Flipkart Assured quality.</p>" },
      { id: id("pg_"), slug: "shipping-returns", title: "Shipping & Returns", content: "<h3>Shipping</h3><p>Orders ship within 24 hours. Standard delivery 3–6 business days across India. Free shipping on orders above ₹999.</p><h3>Returns</h3><p>Clothing: 7-day easy returns. Jewellery: exchange within 7 days, lifetime plating warranty. Contact support to start a return.</p>" },
      { id: id("pg_"), slug: "privacy-policy", title: "Privacy Policy", content: "<p>We only collect information needed to process your orders. We never sell your data. Payments handled by PCI-DSS partners.</p>" },
      { id: id("pg_"), slug: "terms", title: "Terms of Service", content: "<p>Prices inclusive of GST. Jewellery images may have slight color variation due to lighting. We reserve right to cancel orders with pricing errors, with full refund.</p>" },
      { id: id("pg_"), slug: "faq", title: "FAQ", content: "<h3>Is jewellery real gold?</h3><p>Our jewellery is gold-plated / silver-plated with 1-year warranty, unless marked as pure silver.</p><h3>Clothing sizes?</h3><p>Check size chart on each product page. Free exchange for size issues.</p><h3>COD available?</h3><p>Yes, COD available on most pincodes with small fee.</p>" },
    ])
    .onConflictDoNothing()
    .run();

  // Sample orders
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
