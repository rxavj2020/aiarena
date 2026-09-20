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
| Storefront | `/` | — |
| Customer demo | `/login` | customer@example.com / customer1234 |
| **Admin console** | `/admin` | admin@example.com / admin1234 |

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
| **Shiprocket** | Credentials test (extend `lib/plugins/payments.ts` for order push) |
| **WhatsApp button, Analytics (GA4/Pixel)** | Zero-code marketing widgets |

Only one payment gateway can be active at a time (enabling one disables the other).

## Project layout
```
src/app/(store)      storefront routes      src/lib/db          schema + auto-migrations (SQLite)
src/app/admin        admin console          src/lib/plugins     registry, mail, payments, storage
src/app/api          webhooks, uploads, CSV src/actions         server actions (cart, checkout, admin)
src/components       store / admin / ui     scripts/seed.ts     demo data
```

## Scripts
`npm run dev` · `npm run build && npm start` · `npm run db:seed` · `npm run db:reset` · `npm run typecheck` · `npm run lint`

See **DEPLOY.md** for hosting behind Cloudflare.
