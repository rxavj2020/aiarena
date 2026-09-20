import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const now = () => sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role", { enum: ["customer", "admin"] }).notNull().default("customer"),
  createdAt: text("created_at").notNull().default(now()),
});

export const addresses = sqliteTable("addresses", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label").default("Home"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("IN"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  parentId: text("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
});

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    shortDescription: text("short_description"),
    price: integer("price").notNull(), // minor units (paise)
    compareAtPrice: integer("compare_at_price"),
    costPrice: integer("cost_price"),
    sku: text("sku"),
    stock: integer("stock").notNull().default(0),
    trackStock: integer("track_stock", { mode: "boolean" }).notNull().default(true),
    status: text("status", { enum: ["active", "draft", "archived"] }).notNull().default("active"),
    images: text("images", { mode: "json" }).$type<string[]>().notNull().default([]),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
    options: text("options", { mode: "json" }).$type<{ name: string; values: string[] }[]>().notNull().default([]),
    weightGrams: integer("weight_grams"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: text("created_at").notNull().default(now()),
    updatedAt: text("updated_at").notNull().default(now()),
  },
  (t) => [index("products_status_idx").on(t.status), index("products_category_idx").on(t.categoryId)]
);

export const variants = sqliteTable("variants", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // e.g. "Red / M"
  optionValues: text("option_values", { mode: "json" }).$type<Record<string, string>>().notNull().default({}),
  price: integer("price"),
  sku: text("sku"),
  stock: integer("stock").notNull().default(0),
  image: text("image"),
});

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    orderNumber: integer("order_number").notNull().unique(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    phone: text("phone"),
    status: text("status", { enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"] })
      .notNull()
      .default("pending"),
    paymentStatus: text("payment_status", { enum: ["unpaid", "paid", "failed", "refunded", "cod"] }).notNull().default("unpaid"),
    paymentProvider: text("payment_provider"),
    paymentRef: text("payment_ref"),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    shipping: integer("shipping").notNull().default(0),
    tax: integer("tax").notNull().default(0),
    total: integer("total").notNull(),
    couponCode: text("coupon_code"),
    shippingAddress: text("shipping_address", { mode: "json" }).$type<Address>().notNull(),
    customerNote: text("customer_note"),
    adminNote: text("admin_note"),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    carrier: text("carrier"),
    createdAt: text("created_at").notNull().default(now()),
    updatedAt: text("updated_at").notNull().default(now()),
  },
  (t) => [index("orders_status_idx").on(t.status), index("orders_user_idx").on(t.userId)]
);

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id"),
  variantId: text("variant_id"),
  name: text("name").notNull(),
  variantTitle: text("variant_title"),
  sku: text("sku"),
  image: text("image"),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
});

export const orderEvents = sqliteTable("order_events", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull().default(now()),
});

export const coupons = sqliteTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["percent", "fixed", "free_shipping"] }).notNull(),
  value: integer("value").notNull().default(0),
  minOrder: integer("min_order").notNull().default(0),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  startsAt: text("starts_at"),
  expiresAt: text("expires_at"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  authorName: text("author_name").notNull(),
  rating: integer("rating").notNull(),
  title: text("title"),
  body: text("body").notNull(),
  approved: integer("approved", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(now()),
});

export const pages = sqliteTable("pages", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  showInFooter: integer("show_in_footer", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull().default(now()),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
});

export const plugins = sqliteTable("plugins", {
  id: text("id").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  config: text("config", { mode: "json" }).$type<Record<string, string>>().notNull().default({}),
  lastTestAt: text("last_test_at"),
  lastTestOk: integer("last_test_ok", { mode: "boolean" }),
  lastTestMessage: text("last_test_message"),
});

export const subscribers = sqliteTable("subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: text("created_at").notNull().default(now()),
});

export const mailLog = sqliteTable("mail_log", {
  id: text("id").primaryKey(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  ok: integer("ok", { mode: "boolean" }).notNull(),
  error: text("error"),
  createdAt: text("created_at").notNull().default(now()),
});

export type Address = {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Variant = typeof variants.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Plugin = typeof plugins.$inferSelect;
