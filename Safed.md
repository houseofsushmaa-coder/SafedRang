# Safedrang Website — Frontend PRD

**Product:** Safedrang.com — D2C Chikankari & Zardozi saree brand
**Scope:** Frontend (UI/UX, markup, styling, client-side interactions) only
**Out of scope:** Backend, database, payment gateway, inventory, order management, CMS/admin, authentication logic — this document assumes those are handled separately (e.g. existing WooCommerce stack) and only defines what the frontend needs to *call* or *display*.

---

## 1. Purpose

Rebuild Safedrang's storefront frontend to read as a premium, editorial handloom-craft brand — positioning every saree as a rare, handcrafted, "one-of-one" object rather than a catalogue product — while remaining fully functional as an e-commerce frontend (browsable, searchable, purchasable).

## 2. Goals

- Communicate "luxury without repetition" visually within the first screen (hero).
- Make craft storytelling (chikankari, zardozi, artisans, process) a first-class part of the shopping journey, not a separate "About" afterthought.
- Support a mixed catalogue (one-of-one pieces + repeatable lines like kurta sets) without diluting the premium feel.
- Be mobile-first: majority of traffic is expected via Instagram → mobile web.
- Keep international buyers confident: shipping, customs and returns information surfaced early, not hidden at checkout.

## 3. Non-goals

- Payment processing, gateway selection/integration logic
- Cart/checkout backend logic, order state, inventory sync
- CMS/admin tooling for content or product entry
- User auth (login/signup logic) — frontend only needs the UI shell for it
- Recommendation/personalization engines

## 4. Target Users

| Persona | Context | Needs from frontend |
|---|---|---|
| Discovery buyer | Lands from Instagram/ad on mobile | Fast-loading hero, clear "what is this brand" in 5 seconds |
| Considered buyer | Browsing Shop/Collections | Filters, clear craft/fabric details, one-of-one badge clarity |
| International buyer | Product page → shipping page | Visible shipping/customs/duties info pre-checkout |
| Returning/loyal customer | Journal, Instagram, newsletter | Brand storytelling, archive of past one-of-one pieces |

## 5. Sitemap (Frontend Pages/Templates)

1. **Homepage** — hero, promise, one-of-one edit, shop collections, craft story, process timeline, artisans, founder story, shipping teaser, reviews, journal preview, Instagram, newsletter
2. **Shop / Collection listing** — grid + filters (category, craft, fabric, colour, occasion, price)
3. **Product Detail Page (PDP)** — gallery, price, craft details table, one-of-one badge/sold state, add-to-cart UI, trust strip, shipping/returns short version
4. **One-of-One Archive** — gallery of sold one-of-one pieces (view-only, no purchase CTA)
5. **The Craft / Our Story** — chikankari + zardozi long-form storytelling, artisan section
6. **Founder Story (full)** — long-form narrative page
7. **Worldwide Shipping** — India + International tables (delivery time, charges, tracking, customs/duties/taxes)
8. **Care Guide** — photo-led care instructions
9. **Shipping & Returns** — policy page
10. **Journal (blog index + article template)**
11. **Cart / Checkout shell** — frontend UI only; submits to backend, no logic owned here
12. **Account shell** — login/signup/order-history UI only, no auth logic

## 6. Design System

**Colour tokens**
| Token | Hex | Usage |
|---|---|---|
| Warm Ivory | `#FAF5EC` | Primary background |
| Ivory Deep | `#F2EBDD` | Secondary section background |
| Soft Blush | `#F0DAD2` | Secondary background, image placeholders |
| Antique Gold | `#AE8A54` | Borders, dividers, hover states, icons — used sparingly |
| Deep Wine | `#6E1E2A` | Premium/one-of-one panels, accent CTA |
| Dark Charcoal | `#2A211D` | Primary text |
| Warm Taupe | `#8B7863` | Secondary text |

**Typography**
- Headings: Cormorant Garamond (serif) — italic used for emotional/editorial lines
- Body/UI: Manrope (sans-serif)
- Line length: <80 characters for body copy

**Core components to build**
- Sticky header (announcement bar + nav + search/wishlist/cart icons + mobile menu)
- Product card (image, name, price, one-of-one / sold badge)
- Filter sidebar/drawer (category, craft, fabric, colour, occasion, price range)
- PDP gallery (multi-image + zoom, video slot)
- Craft-details table component (reusable on PDP)
- Process timeline component (numbered steps, used for "Chhapai to Creation")
- Review/testimonial card ("Worn & Loved")
- Journal article card
- Newsletter signup block
- Trust-strip component (secure payment / shipping / handcrafted / tracked delivery)
- Footer (multi-column)

## 7. Page-Level Frontend Requirements

### 7.1 Homepage
- Hero: full-bleed image/video slot + headline + two CTAs; must load LCP image within budget (see §9)
- One-of-One Edit: visually distinct (wine background) full-width panel
- Shop Collections: 4-tile grid, responsive to 2-tile on mobile
- Process timeline: horizontal on desktop, vertical on mobile
- All sections lazy-load below the fold

### 7.2 Shop / Collection
- Filter state reflected in URL query params (frontend responsibility; filtering logic itself can be client-side on a pre-fetched dataset or server-driven — to be confirmed with backend team)
- Empty state for zero results
- Sort control (price, newest) — UI only

### 7.3 Product Detail Page
- Gallery order per spec: full product → model front → model back → pallu → border → craft close-up → embellishment close-up → fabric texture → blouse → video
- One-of-One badge states: `ONE OF ONE` (available) / `SOLD` + "This piece will not be recreated."
- Craft details table: Fabric, Craft, Embellishment, Saree Length, Blouse, Origin
- Sticky "Add to Cart" bar on mobile
- Short shipping/returns copy inline; link to full policy page

### 7.4 Worldwide Shipping page
- Two clearly separated tables: India / International
- International table must show customs/duties/taxes explicitly — not collapsed behind an accordion by default

### 7.5 Journal
- Index: card grid, category tag per card
- Article template: single-column, image support, <80 char line length

## 8. Responsive & Accessibility Requirements

- Breakpoints: mobile (≤600px), tablet (601–900px), desktop (≥901px)
- All interactive elements keyboard-navigable with visible focus states
- Colour contrast: body text on ivory/blush backgrounds must meet WCAG AA
- Respect `prefers-reduced-motion`
- Images: responsive `srcset`, lazy-loaded below the fold, explicit width/height to prevent layout shift

## 9. Performance Targets (Frontend)

- LCP < 2.5s on 4G mobile
- CLS < 0.1
- Fonts: preload Cormorant Garamond + Manrope, `font-display: swap`
- No render-blocking third-party scripts above the fold

## 10. Frontend ↔ Backend Contract (assumptions, not owned here)

The frontend expects the following data to be provided by the backend/CMS — exact API shape to be defined separately:
- Product data: name, price, availability/sold state, craft details, images, category/craft/fabric/colour/occasion tags
- Collection/filter data
- Shipping rate/customs copy by country
- Journal articles
- Newsletter submission endpoint
- Cart/checkout endpoints (frontend only renders state passed to it)

## 11. Open Questions

- Final CMS/theme: continuing on WooCommerce or migrating?
- Will filters be server-side (paginated API) or client-side on a pre-loaded catalogue?
- Payment gateway selection (affects only the checkout UI shell, not logic)
- Confirmed photography/video assets — current homepage design uses placeholder motifs pending shoot

## 12. Success Metrics (Frontend-attributable)

- Bounce rate on homepage (post-launch vs baseline)
- Mobile PDP → Add-to-Cart conversion rate
- Time on Journal/Craft pages (storytelling engagement)
- Core Web Vitals pass rate