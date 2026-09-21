# Aurelia Commerce — Website Isolation, Themes & Admin Overhaul

Working branch: `arena/01a0c434-aiarena` (do **not** merge to `main` until the owner says so).

## Problems
1. Tenant websites are a single page (`/store/[slug]`); product/cart links fall through to the shared legacy store whose logo navigates to the platform home (`/`) — tenant and platform identities intersect.
2. No real theme layer: brand colours do not compose into a consistent site-wide theme, and visitors cannot choose & keep an appearance across pages.
3. Carts and orders are not tenant-scoped (orders default to `tenant_aurelia`), so "separate websites" share state.
4. Admin dashboard is a flat tab bar without an overview; the platform shell links to dead `/admin/*` routes.

## Plan
### 1. Tenant website isolation
- Full per-store site under `/store/[slug]/*`: home, shop, product detail, cart, checkout, order success, order tracking.
- Site chrome (header/footer) lives in `store/[slug]/layout.tsx`; the logo always links to that website's home; every internal link is site-prefixed.
- `/site/[slug]` and `/site/[slug]/*` redirect to the canonical `/store/[slug]…` URLs.
- The platform appears on a tenant site only as a small footer attribution opening in a new tab — never part of navigation.

### 2. Theme system (persists through that website's all pages)
- **Owner layer** — `TenantTheme` (preset, brand colours, font, radius, default appearance) stored on the tenant record and applied via CSS variables on every page of that website only. Presets: Minimal, Vivid, Elegant, Noir, Organic.
- **Visitor layer** — Light / Dark / System appearance toggle in the site header. Persisted in an `appearance` cookie whose `Path` is scoped to the website (`/store/[slug]`), so the choice survives navigation on that site only and never affects other websites or the platform.

### 3. Tenant-scoped commerce
- Cart cookie namespaced per tenant (`cart_{tenantId}`), cart/checkout actions accept the tenant context.
- Orders placed on a tenant site are stamped with that tenant; payment gateway returns redirect back to that site's success page.

### 4. Admin dashboard (big-platform feel)
- Left sidebar navigation + **Overview** tab: KPI cards, setup progress, recent orders, quick actions.
- **Theme & Appearance editor** in settings: preset cards, colour pickers, radius/font, default appearance, live preview.
- Platform shell links updated from dead `/admin/*` routes to `/dashboard?tab=…`.

### 5. Platform website content
- Expanded marketing landing: hero, proof points, feature grid, how it works, pricing, FAQ, final CTA — in line with the major commerce platforms.

## Non-goals (follow-ups)
- Custom-domain deep-link rewrites (custom domains keep root → tenant home; canonical site URLs are `/store/[slug]/*`).
- Per-tenant CMS pages and customer accounts on tenant sites.
