import type Database from "better-sqlite3";

// Idempotent schema bootstrap so the app works with zero setup (no CLI migrations needed).
export function ensureSchema(sqlite: Database.Database) {
  sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, name TEXT NOT NULL, phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer', created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT 'Your store, your way', status TEXT NOT NULL DEFAULT 'setup',
  plan TEXT NOT NULL DEFAULT 'starter', logo_url TEXT, favicon_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#151515', accent_color TEXT NOT NULL DEFAULT '#c98b5b',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS tenant_members (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL DEFAULT 'owner',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS tenant_members_unique_idx ON tenant_members(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS tenant_members_tenant_idx ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_members_user_idx ON tenant_members(user_id);
CREATE TABLE IF NOT EXISTS tenant_integrations (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0, config TEXT NOT NULL DEFAULT '{}',
  last_test_at TEXT, last_test_ok INTEGER, last_test_message TEXT, last_test_config_hash TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS tenant_integrations_unique_idx ON tenant_integrations(tenant_id, provider);
CREATE INDEX IF NOT EXISTS tenant_integrations_tenant_idx ON tenant_integrations(tenant_id);
CREATE TABLE IF NOT EXISTS store_domains (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL UNIQUE, kind TEXT NOT NULL DEFAULT 'custom', status TEXT NOT NULL DEFAULT 'pending',
  verification_token TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS store_domains_tenant_idx ON store_domains(tenant_id);
INSERT OR IGNORE INTO tenants (id, slug, name, tagline, status, plan, primary_color, accent_color)
VALUES ('tenant_aurelia', 'aurelia', 'Aurelia', 'Clothing & Jewellery · Crafted for you', 'active', 'growth', '#2874f0', '#fb641b');
CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, label TEXT DEFAULT 'Home',
  name TEXT NOT NULL, phone TEXT NOT NULL, line1 TEXT NOT NULL, line2 TEXT, city TEXT NOT NULL, state TEXT NOT NULL,
  postal_code TEXT NOT NULL, country TEXT NOT NULL DEFAULT 'IN', is_default INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT, image TEXT, parent_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0, featured INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT '', short_description TEXT,
  price INTEGER NOT NULL, compare_at_price INTEGER, cost_price INTEGER, sku TEXT, stock INTEGER NOT NULL DEFAULT 0,
  track_stock INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'active', images TEXT NOT NULL DEFAULT '[]',
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL, featured INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]', options TEXT NOT NULL DEFAULT '[]', weight_grams INTEGER, seo_title TEXT, seo_description TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);
CREATE TABLE IF NOT EXISTS variants (
  id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, title TEXT NOT NULL,
  option_values TEXT NOT NULL DEFAULT '{}', price INTEGER, sku TEXT, stock INTEGER NOT NULL DEFAULT 0, image TEXT);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, order_number INTEGER NOT NULL UNIQUE, user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL, phone TEXT, status TEXT NOT NULL DEFAULT 'pending', payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_provider TEXT, payment_ref TEXT, subtotal INTEGER NOT NULL, discount INTEGER NOT NULL DEFAULT 0,
  shipping INTEGER NOT NULL DEFAULT 0, tax INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL, coupon_code TEXT,
  shipping_address TEXT NOT NULL, customer_note TEXT, admin_note TEXT, tracking_number TEXT, tracking_url TEXT, carrier TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id);
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id TEXT, variant_id TEXT,
  name TEXT NOT NULL, variant_title TEXT, sku TEXT, image TEXT, price INTEGER NOT NULL, quantity INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS order_events (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE, type TEXT NOT NULL, message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, type TEXT NOT NULL, value INTEGER NOT NULL DEFAULT 0, min_order INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER, used_count INTEGER NOT NULL DEFAULT 0, starts_at TEXT, expires_at TEXT, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL, rating INTEGER NOT NULL, title TEXT, body TEXT NOT NULL, approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '', published INTEGER NOT NULL DEFAULT 1,
  show_in_footer INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS plugins (
  id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0, config TEXT NOT NULL DEFAULT '{}', last_test_at TEXT, last_test_ok INTEGER, last_test_message TEXT, last_test_config_hash TEXT);
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS mail_log (
  id TEXT PRIMARY KEY, "to" TEXT NOT NULL, subject TEXT NOT NULL, ok INTEGER NOT NULL, error TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
`);
  // additive column migrations
  const cols = (sqlite.prepare("PRAGMA table_info(orders)").all() as { name: string }[]).map((c) => c.name);
  for (const [name, ddl] of [["shiprocket_order_id", "TEXT"], ["shiprocket_shipment_id", "TEXT"], ["label_url", "TEXT"]]) {
    if (!cols.includes(name)) sqlite.exec(`ALTER TABLE orders ADD COLUMN ${name} ${ddl}`);
  }
  const pluginCols = (sqlite.prepare("PRAGMA table_info(plugins)").all() as { name: string }[]).map((c) => c.name);
  if (!pluginCols.includes("last_test_config_hash")) sqlite.exec("ALTER TABLE plugins ADD COLUMN last_test_config_hash TEXT");
  const tenantIntegrationCols = (sqlite.prepare("PRAGMA table_info(tenant_integrations)").all() as { name: string }[]).map((c) => c.name);
  if (!tenantIntegrationCols.includes("last_test_config_hash")) sqlite.exec("ALTER TABLE tenant_integrations ADD COLUMN last_test_config_hash TEXT");
  const productCols = (sqlite.prepare("PRAGMA table_info(products)").all() as { name: string }[]).map((c) => c.name);
  if (!productCols.includes("tenant_id")) sqlite.exec("ALTER TABLE products ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'tenant_aurelia'");
  if (!cols.includes("tenant_id")) sqlite.exec("ALTER TABLE orders ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'tenant_aurelia'");
  const tenantCols = (sqlite.prepare("PRAGMA table_info(tenants)").all() as { name: string }[]).map((c) => c.name);
  if (!tenantCols.includes("theme")) sqlite.exec("ALTER TABLE tenants ADD COLUMN theme TEXT");
}
