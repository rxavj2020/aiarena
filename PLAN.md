# Aurelia Commerce — Website Isolation, Themes & Admin Overhaul

Working branch: `arena/01a0c434-aiarena` (do **not** merge to `main` until the owner says so).

## Theme system — "Role Trio" (modelled on vyebhavajewels.com)

The owner provides **three colour codes**. Each owns whole groups of components
(flat brand colours, like a designed jewellery-boutique site — not gradients
inside one component):

| Provided colour | Role | Components that use it |
|---|---|---|
| **Colour 1** | **Frame** | Announcement bar, header / nav / mobile header, hero overlay start, secondary solid buttons |
| **Colour 2** | **Ground** | Footer, ✦ marquee strip, serif headings (h1–h3), story & visit-us panels, hero overlay end |
| **Colour 3** | **Action** | Buttons / CTAs, links, badges (sale/new/discount), cart button + count, active nav chip, form focus rings, success accents |
| *derived* | **Cream** | Page background & panels (white tinted with Ground) |
| *derived* | **Card** | Product cards, inputs — near-white |
| *derived* | **Ink / muted / line** | Body text, captions, borders — tinted with Ground |

- Appearance (light / dark / system) still flips the derived body & cards; the
  three brand colours keep their roles in both modes.
- The palette stripe (header edge + footer edge) shows the three roles in order.
- Presets ship curated role-trios (Royal Emerald, Heritage Maroon, Midnight Gold,
  Indigo Pearl, Terracotta Studio, Rosewood, Emerald Coast, Ink & Coral) — any
  custom triple works because neutrals are derived automatically.

### Reference-site structure (vyebhavajewels.com) applied to the website home
1. Announcement + header (Frame)
2. Poster hero — serif headline, two CTAs (Action filled + ghost)
3. ✦ marquee band (Ground) with the brand's pillars
4. "A considered edit" editorial story split
5. "Shop by category" quiet browse cards
6. Value trio (trust / guidance / occasion)
7. "Curated highlights" product grid + view-all
8. "Visit us / get in touch" block with store details
9. Rich footer (Ground): brand, links, support, store address & contact

### Admin theme editor
Three swatches labelled by role (1 · Header, 2 · Footer & sections, 3 · Buttons)
+ live mini-preview showing header/footer/buttons with the mapping, presets,
font, corner style and default appearance.

## Earlier work (committed)
1. Tenant websites isolated under `/store/{slug}/*` (home, shop, product, cart,
   checkout, success, track) — logo → site home, links stay in-site, per-site
   carts and orders, `/site/{slug}` aliases redirect.
2. Visitor appearance (light/dark/system) persisted per website via scoped cookie.
3. Admin dashboard (`/dashboard`): sidebar Overview / Setup / Products / Orders / Plugins / Settings; the **Brand & Theme** role-trio editor lives in Settings (3-colour quick form in Setup); dead `/admin/*` links fixed.
4. Platform marketing site expanded (features, how-it-works, pricing, FAQ).

## Non-goals (follow-ups)
- Custom-domain deep-link rewrites; per-tenant CMS pages and customer accounts.
