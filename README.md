# Aurelia Commerce — full-stack e-commerce platform

A production-ready storefront **plus** a dedicated admin console, built with Next.js 15 (App Router), TypeScript, Tailwind v4, Drizzle ORM and SQLite. Zero external services are required to run it — plug in payments, email, storage and CDN from the admin **Plugins** page when you're ready.

## Quick start

```bash
npm install
npm run db:seed     # creates data/store.db with demo catalogue + admin user
npm run dev         # http://localhost:3000
```

| Role | URL | Login |
|---|---|---|
| SaaS landing / Studio | `/platform` | — |
| Workspace owner signup | `/platform/signup` | — |
| Storefront demo | `/` | — |
| Customer demo | `/login` | customer@example.com / customer1234 |
| **Store admin** | `/admin` | admin@example.com / admin1234 |

Change admin credentials via `ADMIN_EMAIL` / `ADMIN_PASSWORD` before the first seed, or promote any user from **Admin → Customers**. Set a strong `AUTH_SECRET` in `.env.local` (see `.env.example`).

## Storefront features
- Home page built from configurable sections (hero, USPs, categories, featured, banner, new arrivals, rich text)
- Catalogue with categories/sub-categories, search, price filters, sorting (incl. "biggest discount"), pagination
- Product pages: gallery, variants (size/colour…), stock awareness, reviews with moderation, related products, JSON-LD schema
- Cart (cookie-based, works for guests), coupons (percent / fixed / free-shipping with limits & dates)
- Checkout: guest or logged-in, saved addresses, COD (with fee) or online payment via **Razorpay / Cashfree**
- Order success page, account area (orders, tracking timeline, addresses), public **Track order** page
- CMS pages (`/pages/slug`), contact form, newsletter signup, announcement bar, WhatsApp button
- SEO: metadata, Open Graph, sitemap.xml, robots.txt; GA4 + Meta Pixel with purchase events

## Admin console (`/admin`)
- **Dashboard** — revenue (30d/today), orders to fulfil, sales chart, top products, low stock, setup warnings
- **Orders** — status tabs, search, bulk status changes, one-click "next step", packing-slip printing, CSV export, detail page with fulfilment (carrier/tracking auto-links), payment status, internal notes, timeline, resend emails
- **Products** — inline price/stock/status/featured editing, bulk actions, duplicate, full editor with image upload, variants generator, margin calc, SEO
- **Categories, Coupons, Customers (roles), Reviews (moderation), Pages (HTML + preview)**
- **Content & Design** — branding, colours, logo, hero, homepage section builder, nav menu, announcement, footer, social, custom code
- **Store settings** — shipping rates, free-shipping threshold, COD, tax (inclusive GST), notifications, currency
- **Plugins** — see below · **Mail log** — every email attempt with result

## Plugins (minimal-setup integrations)
Each plugin has a guided setup, a *Test connection* button and an on/off switch. Secrets are stored in the DB and never sent back to the browser.

| Plugin | What it does |
|---|---|
| **Razorpay** | Checkout.js flow, server-side signature verification, webhook (`/api/webhooks/razorpay`) |
| **Cashfree** | PG v3 hosted checkout, return-URL verification, webhook (`/api/webhooks/cashfree`) |
| **Email (SMTP)** | Order confirmation to customer, new-order alert to you, shipping updates, contact form. Works with Gmail app passwords, Zoho, Resend, SES, Brevo… |
| **Cloudflare R2** | Uploads go to R2 (S3 API) with a public/custom domain; falls back to `/public/uploads` |
| **Cloudflare Hosting** | Deployment guide + API-based *Purge cache* button |
| **Shiprocket** | Full delivery management from the order page: compare courier rates, one-click ship (create order → AWB → pickup → label), tracking refresh, cancel, optional auto-create on paid orders, webhook (`/api/webhooks/shiprocket`) that updates order status automatically |
| **Google Firestore** | Durable cloud database: every write is mirrored to Firestore in real time; one-click *Sync everything* and *Restore from Firestore* rebuild the local SQLite index on a fresh server; optional scheduled full sync. Uses the REST API with a service account (no heavy SDK) |
| **WhatsApp button, Analytics (GA4/Pixel)** | Zero-code marketing widgets |

Only one payment gateway can be active at a time (enabling one disables the other).

## Project layout
```
src/app/platform     SaaS control plane      src/lib/platform    tenants, workspaces, domains
src/app/(store)      legacy storefront       src/lib/db          schema + auto-migrations (SQLite)
src/app/site/[slug]  tenant storefront route  src/lib/plugins     registry, mail, payments, storage
src/app/admin        store admin console      src/actions         server actions (cart, checkout, admin, platform)
src/app/api          webhooks, uploads, CSV  src/components      platform / store / admin / ui
scripts/seed.ts      demo data (legacy Aurelia workspace)
```

## Scripts
`npm run dev` · `npm run build && npm start` · `npm run db:seed` · `npm run db:reset` · `npm run typecheck` · `npm run lint`

See **DEPLOY.md** for hosting behind Cloudflare.

## SaaS workspace model (new)

Aurelia now has a three-layer foundation for turning the single-store demo into a multi-tenant commerce platform:

| Layer | Route | Responsibility |
|---|---|---|
| **Aurelia Studio** | `/platform` | Subscriber onboarding, workspaces, plans, Firestore connection, brand and domain setup |
| **Store admin** | `/admin` | Products, orders, customers, content, plugins and store operations for the active workspace |
| **Public store** | `/site/{workspace-slug}` | The customer-facing branded storefront; verified custom domains resolve to the same tenant route |

### First-time subscriber flow

1. Create an owner account at `/platform/signup`.
2. Create a workspace and choose a plan.
3. Connect the workspace's Firebase service account. The connection is tested with a Firestore read/write request before launch.
4. Configure the logo, brand colours and tagline.
5. Add a custom domain. Aurelia shows the DNS record and keeps the domain pending until it is verified.
6. Launch the public site and use the workspace's admin console.

Workspace Firestore credentials are encrypted before they are written to `tenant_integrations` and are never returned to the browser. New workspaces start with an empty catalogue; no demo products, customers or orders are copied into them. The subscriber product builder writes to a collection prefix that always includes the workspace slug, even when two stores use the same Firebase project.

The existing seeded Aurelia workspace remains available at `/`, `/admin` and `/site/aurelia` so the current demo can continue to be reviewed. For safety, a newly created workspace never displays the legacy Aurelia records. Its tenant-safe admin starts with a Firestore-backed product builder; orders, customers, content and the remaining plugins can be added to the same tenant repository without changing the public/store boundary.
