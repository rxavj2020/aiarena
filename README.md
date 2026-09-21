# Aurelia Commerce — full-stack e-commerce platform

A three-layer SaaS commerce platform with a marketing site, subscriber stores and tenant storefronts, built with Next.js 15 (App Router), TypeScript, Tailwind v4, Drizzle ORM and SQLite. Firestore-backed tenant catalogue data is isolated from the seeded Aurelia demo; connect payments, email, storage and CDN from the store admin **Plugins** page when you're ready.

## Quick start

```bash
npm install
npm run db:seed     # creates data/store.db with demo catalogue + admin user
npm run dev         # http://localhost:3000
```

| Role | URL | Login |
|---|---|---|
| SaaS marketing website | `/` | — |
| Authenticated store control plane | `/platform` | — |
| Store owner signup | `/register` or `/platform/signup` | — |
| Store owner login | `/login` or `/platform/login` | — |
| Legacy Aurelia storefront | `/store/aurelia` (`/site/aurelia` alias) | — |
| **Store admin** | `/admin` | admin@example.com / admin1234 for the legacy demo |

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

### OAuth-enabled connections
Gmail SMTP and Google Firestore can use Google OAuth2 instead of manually entering a Gmail app password or Firestore service-account key. Configure a Google OAuth **Web application** in Google Cloud, add the callback URLs shown in the UI (`/api/oauth/google/callback` for admin plugins and `/api/oauth/google/firestore/callback` for subscriber store setup), and set `GOOGLE_CLIENT_ID` plus `GOOGLE_CLIENT_SECRET` on the Aurelia deployment. The admin still enters the SMTP host or Firestore project ID so the connection is unambiguous. OAuth refresh tokens and all API secrets are encrypted at rest; the browser only receives masked values.

Razorpay, Cashfree, Cloudflare, R2 and Shiprocket use their provider-issued API credentials or provider login flows because those are the supported server integration methods. The plugin page provides a help icon beside every field, a step-by-step guide, webhook URLs where relevant, connection testing and a clear enablement check.

## Project layout
```
src/app/platform     SaaS control plane      src/lib/platform    tenants, single-store access, domains
src/app/(store)      legacy store routes     src/lib/db          schema + auto-migrations (SQLite)
src/app/store/[slug] canonical tenant site   src/lib/plugins     registry, mail, payments, storage
src/app/site/[slug]  compatibility alias      src/actions         server actions (cart, checkout, admin, platform)
src/app/admin        subscriber store admin (legacy demo remains compatible)
src/app/api          webhooks, uploads, CSV  src/components      platform / store / admin / ui
scripts/seed.ts      demo data (legacy Aurelia store)
```

## Scripts
`npm run dev` · `npm run build && npm start` · `npm run db:seed` · `npm run db:reset` · `npm run typecheck` · `npm run lint`

See **DEPLOY.md** for hosting behind Cloudflare.

## SaaS single-store model

Aurelia has three deliberately separate layers:

| Layer | Route | Responsibility |
|---|---|---|
| **Aurelia platform** | `/` and `/platform` | SaaS marketing, subscriber signup/login, one-store onboarding, plans, Firestore connection, brand and domain setup |
| **Store admin** | `/admin` | One subscriber's private dashboard for products, orders, settings and plugins |
| **Public store** | `/store/{store-slug}` | The customer-facing branded storefront; `/site/{store-slug}` remains a compatibility alias and verified custom domains render the same tenant |

Each subscriber account gets one store and one public website. The platform does not expose workspace lists, switching controls or repeat-store creation to normal subscribers. Existing legacy memberships are resolved to their oldest primary store for compatibility, while the seeded Aurelia demo remains available explicitly at `/store/aurelia`.

### First-time subscriber flow

1. Create an owner account at `/platform/signup`.
2. Name your one store and choose a public URL.
3. Connect the store's Firebase service account or Google OAuth connection. The connection is tested with a Firestore read/write request before launch.
4. Configure the logo, brand colours and tagline from **Settings**.
5. Add a custom domain. Aurelia shows the DNS record and keeps the domain pending until it is verified.
6. Launch the public site and use `/admin` for products, orders, settings and provider integrations.

Store Firestore credentials and provider secrets are encrypted before they are written to `tenant_integrations` and are never returned to the browser. New subscriber stores start with an empty catalogue; no legacy demo products, customers or orders are copied into them. The product and order views read only the store's namespaced Firestore collection, even when two stores use the same Firebase project.
