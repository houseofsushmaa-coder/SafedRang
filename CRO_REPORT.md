# Safed Rang — Phase Seven CRO Report

Prepared 31 Oct 2026. Covers the storefront journey (Home → Shop → Product → Bag → Checkout → Payment → Confirmation), the payment back end, analytics, and trust content.

**Status:** all changes are in the working tree, **not committed and not deployed**. The production build passes (`npm run build`). The edge functions were syntax-checked but not type-checked or run, because Deno isn't installed locally. Payment flows were **not** exercised end to end, because that needs the new functions deployed to Supabase (see §0).

---

## 0. Before anything else — deploy order (important)

The new storefront calls new server functions. Deploying in the wrong order breaks checkout.

1. **Confirm the COD fee.** Checkout now uses *Admin → Settings → Shipping → COD charge*, which is currently **₹50**. The old checkout hard-coded **₹39**. Set the admin value to the fee you actually want.
2. **Deploy the edge functions** (from `SafedRang/`):
   ```
   npx supabase functions deploy cashfree-order cashfree-verify cashfree-webhook place-cod-order
   ```
   These secrets must be set in Supabase: `VITE_CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `VITE_CASHFREE_ENV` (`SANDBOX`/`PRODUCTION`) and `SITE_URL` (e.g. `https://safedrang.com`). `SUPABASE_SERVICE_ROLE_KEY` is provided automatically.
3. **Deploy the frontend** (`npm run build` → upload `frontend/dist`).
4. **Run `supabase/security_lockdown_migration.sql`** in the SQL Editor. Only run it after steps 2–3: it stops the browser from writing orders directly, which the old checkout relied on.
5. **Place one sandbox order of each type** (online + COD) and confirm it in Admin → Orders.

---

## A. Customer journey audit

| Stage | Friction found (evidence) | Status |
|---|---|---|
| Home | Hero is four autoplay videos with **no headline or CTA**; phones download **~38 MB** of video (`video2.mp4` alone is 29 MB). Home shows **no products**, although 32 are flagged `featured`. | Fixed (entry band + featured grid; 2 light videos on mobile). Video re-encode still to do. |
| Shop | **Every filter click froze the page.** `getAllCategories()` returned a new array each render, so the URL-sync effect looped ("Maximum update depth exceeded") and React stopped applying updates. Category/craft/fabric/price filters did nothing. | Fixed and verified (Sarees → 87 items, sort price↑ verified, 0 loop errors). |
| Shop | All ~165 product images loaded eagerly at once. | Fixed: only the first row is eager; the rest lazy-load. |
| Product (social/search landing) | Direct visits showed **"Product Not Found"** while the catalogue was loading. | Fixed: loading state instead. |
| Product (mobile) | On a 375×812 phone the **price is at 892 px and Add to Cart at 1015 px**: both below the fold; the first screen is the photo only. | Fixed: mobile sticky bar (price + Add to Bag) while the main buttons are off-screen; WhatsApp bubble moves up to avoid overlap. |
| Bag | Bag was a desktop hover menu only; **on phones the bag icon jumps to checkout, where items could not be removed or re-quantified.** "Cart" breadcrumb linked to `/cart`, which doesn't exist (redirected home). | Fixed: editable bag (qty ±, remove) in checkout; mobile collapsible bag summary above the form. |
| Bag | Quantities were not capped by stock; a One-of-One could be added ×10. | Fixed: capped at live stock with a clear message. |
| Checkout (mobile) | Order summary rendered **after** the Continue button, and overflowed the screen (509 px column in a 335 px grid). | Fixed. |
| Checkout | Validation only checked "not empty". PIN, Indian mobile and email formats were not checked; input was lost after a failed payment. | Fixed: inline validation on blur; input kept for the tab session. |
| Payment return | Pending UPI payments were reported as **"Payment Unsuccessful"**, inviting a second payment. "Contact Support" linked to /about. | Fixed: "still processing — check again" state; support → /contact. |
| Contact | **The contact form never sent anything** ("Simulate luxury inquiry dispatch") but told customers they'd hear back in 24 h. | Fixed: opens WhatsApp with the message pre-filled; email fallback. |

## B. Homepage CRO
- Added a slim entry band under the (unchanged) video hero: "Handcrafted in Lucknow", one line on what you make, **Shop the Collection** and **The One of One Edit**. The text overlay on the hero itself was removed deliberately in an earlier commit, so I left the hero clean.
- Added **Featured Creations** (8 in-stock products with `featured = true`, in admin display order; "View all" → /shop).
- Phones now load 2 of the 4 hero clips (~4.5 MB instead of ~38 MB).
- **To verify (owner):** the six "WORN & LOVED" testimonials are hard-coded with `verified: true`. Keep them only if they are real customers who agreed to be quoted.

## C. Shop CRO
- Filters and sorting work again (root cause above). Verified category filter and price sort in the browser.
- Admin category priority and manual ordering are untouched (`sortProducts` / `shopSortSettings` unchanged).
- Product grid loads lazily after the first row.
- Not changed: card design, filter layout, empty state (it was already useful).

## D. Product detail CRO
**Removed fabricated trust signals** (your brief rules these out; fake reviews can also create legal exposure in India):
- 5 gold stars + "(Customer Reviews)" on every product.
- "Client Reviews (4)" tab with the **same three "✓ Verified Buyer" reviews on every product**.
- Made-up spec fallbacks: "Pure Mulberry Silk", "Lucknowi Hand Chikankari", SKU "SR-LUX-001", "0.650 kg", "30 × 25 × 5 cm" (no product has dimensions, so every page showed the invented size).
- A PIN checker that said **"Delivery available to PIN X! 3–5 business days · Free insured delivery"** for any 6 digits without checking anything.
- "(N available)" stock counts: 156 of 166 products sit at the default stock of 2, so "2 available" showed nearly everywhere, which reads as false scarcity. Now "In Stock" / "Sold Out" only.

**Added (verified information only):**
- Fabric · craft line under the price (all 166 products have both).
- One of One note for flagged pieces.
- Delivery & Payment block using your FAQ's published timelines, plus **"Ask about this piece on WhatsApp"** pre-filled with the product name and link.
- Tabs: Details (only fields that exist: category, fabric, craft, weight, SKU) · Shipping & Exchange · Care (links Care Guide).
- Description line breaks now render (imported text showed literal `\n` blobs), and scripts/handlers are stripped.

**Data for you to fix in Admin:** two of the three One-of-One products have stock **5** and **10**.

## E. Cart & checkout CRO (and payment integrity)
**Critical issues found and fixed in code (live once deployed, §0):**
1. **The amount charged came from the browser.** `cashfree-order` charged whatever `amount` the page sent, so a visitor could pay ₹1 for a ₹15,000 saree. Prices are now computed on the server from the products table (sale price, size modifiers, stock, archived/sold-out checks).
2. **The payment webhook didn't verify Cashfree's signature.** Anyone could POST "payment SUCCESS" and mark an order PAID. It now verifies the HMAC signature and checks the paid amount against the order.
3. **COD orders were written straight from the browser** with browser prices. They now go through the new `place-cod-order` function (server pricing, admin COD fee, India-only, COD on/off from settings).
4. **Stock never went down after a sale**, so One-of-One pieces could sell twice. Stock now drops once per order (when payment is confirmed, or when a COD order is placed). Restocking cancelled orders is still manual.
5. "Magic link sent" emails were never sent (`generateLink` only creates a link). Customers now actually receive a sign-in link. Supabase's built-in mailer is rate-limited, so set up custom SMTP before launch.
6. Orders are marked PAID only by the server after Cashfree confirms. The success page no longer counts anything.

**Friction fixes:** editable bag, mobile summary, inline validation, kept input, honest COD-fee messaging from settings, pending-payment state, accurate delivery copy. Guest checkout already existed (no account required); that is now stated next to the email field.

## F. Trust & WhatsApp
- Floating button switched from `web.whatsapp.com` (fails unless the desktop user is logged into WhatsApp Web) to `wa.me` (app on phones, Web/Desktop on computers), with product context on product pages. Click tracked.
- Delivery timelines unified to your FAQ (dispatch 2–3 business days; India 4–7; international 7–12). Previously four different promises appeared across the site (3–5, 5–7, 4–7, 10–21).
- Success page no longer says "Payment confirmed" for COD, or "Confirmation email on its way" (none is sent).
- **Biggest trust gap — needs you:** there is **no returns / exchange / refund policy and no shipping policy page.** `/returns` and `/shipping` open Terms and Privacy pages that contain neither. Payment gateways like Cashfree normally require published refund and shipping policies. I didn't write policy for you; the only stated term ("exchange for damaged products with 360° unboxing video") is kept.

## G. Analytics & tracking
**Finding:** no analytics is configured. The `tracking_integrations` table is empty (and only existed after you ran its migration in this session), so GA4/Meta/etc. have **never recorded data** for this store.

| Event | Before | Now |
|---|---|---|
| page_view | Fired, but pixels re-initialised on every route (duplicate Meta `init`, double Pinterest page events) | Once per page path; scripts initialise once |
| view_item_list / select_item | Missing | Added (shop lists, home featured) |
| view_item | Fired with wrong field names (`product.name` was undefined) | Fixed, GA4 item schema |
| search | Missing | Added (header search, after typing pauses) |
| filter_apply / sort_change | Missing | Added |
| add_to_wishlist / remove_from_cart | Missing | Added |
| add_to_cart | Only from product page; no items | All add paths, with items |
| view_cart | Missing | **Not added**: there is no separate bag page; `begin_checkout` covers the bag view |
| begin_checkout | No value or items | Value + items |
| add_shipping_info / add_payment_info | Missing | Added |
| purchase | **Fired by just opening `/order-success?order_id=…`**, value 0, no items, so revenue was unreliable | Fires only after the server confirms (Cashfree PAID, or COD order saved), with server value + items; deduplicated by order ID across tabs |
| generate_lead / whatsapp_click | Missing | Added |

Privacy: no customer data is sent to analytics. Customer email was removed from the success-page URL, because it would have been sent to GA4 in `page_location`.
**Verified** in the browser with the development event log: page_view, view_item_list, filter_apply, sort_change, select_item, view_item, add_to_cart, begin_checkout, add_shipping_info, generate_lead. **Not verified live:** purchase and add_payment_info (need deployed functions), and actual delivery to GA4/Meta (nothing configured).

**Consent:** there is no cookie/consent banner. You ship worldwide, so EU visitors would need consent before analytics or ad pixels load. Decide this before enabling pixels.

## H. KPIs & baseline
**No baseline is possible yet.** The orders table holds 14 orders, all created within two hours on 19 Oct 2026 with repeating totals; none is PAID, and the single COD order is cancelled. These look like test orders: there are **zero verified purchases**, and no traffic data at all.

Measurement plan (after configuring GA4 in Admin → Tracking and deploying):
- **Conversion rate** = sessions with a `purchase` ÷ sessions × 100 (GA4).
- **Add-to-cart rate** = sessions with `add_to_cart` ÷ sessions with `view_item`.
- **Checkout completion** = sessions with `purchase` ÷ sessions with `begin_checkout`.
- **AOV / revenue** from the **orders table** (PAID + delivered COD), not from GA4. GA4 misses ad-blocked users, so reconcile weekly.
- Segment by device, source/medium, category, and One-of-One (`item_category2`).
- Wait for **≥ 4 weeks and ≥ 30 verified orders** before treating any rate as a baseline.

## I. Experiments
- **Implemented:** none as A/B tests. The changes above are fixes to broken or misleading behaviour, not variants.
- **Measured:** none (no data).
- **Proposed** (once ≥ ~200 checkouts/month; below that a test can't reach a conclusion):
  1. Entry-band CTA wording ("Shop the Collection" vs "Explore Sarees"). KPI: home → product view rate. Guardrail: bounce rate.
  2. Featured Creations above vs below the One-of-One banner. KPI: home → view_item. Guardrail: One-of-One click rate.
  3. Sticky mobile bar vs none. KPI: mobile add-to-cart rate. Guardrail: WhatsApp clicks, return rate.

## J. Priority matrix

| Finding | Evidence | Priority | Action | Expected KPI |
|---|---|---|---|---|
| Browser-set payment amount | `cashfree-order` used `orderDetails.amount` | **Critical** | Fixed (server pricing) — deploy | Revenue integrity |
| Unsigned webhook could mark orders paid | Signature header never verified | **Critical** | Fixed — deploy | Revenue integrity |
| Customer data publicly readable; anyone can edit orders/prices/roles | Anonymous read of 14 orders, 4 customers, 21 items, 2 profiles confirmed; `USING (true)` policies; `set_user_role` callable by anyone | **Critical** | Migration written — run after deploy | Security / trust |
| Self-promotion to admin | Trigger copies role from user-editable metadata; frontend treated any email containing "admin" as admin | **Critical** | Fixed (migration + AuthContext) | Security |
| Shop filters frozen | Render loop, verified | High | Fixed | Filter use → view_item |
| No editable bag on mobile; dead `/cart` link | Code + browser | High | Fixed | Checkout completion |
| One-of-One oversell (no stock decrement) | No decrement anywhere | High | Fixed — deploy | Fewer cancellations |
| Fake reviews / specs / delivery promise | Hard-coded in ProductDetail | High | Removed | Trust; fewer returns |
| Contact form discarded messages | "Simulate … dispatch" | High | Fixed | Leads |
| Purchase event unreliable | Fired on URL open | High | Fixed | Data accuracy |
| No returns/shipping policy | No content anywhere | High | **Owner to write** | Trust, gateway compliance |
| No analytics configured | Empty tracking table | High | **Owner: add GA4 ID** | Measurement |
| CTA below fold on mobile PDP | 1015 px on 812 px screen | Medium | Sticky bar | Mobile add-to-cart |
| 38 MB hero video | File sizes | Medium | Mobile trimmed; **re-encode video2 (29 MB)** | LCP, bounce |
| No products on home | Code | Medium | Featured grid | Home → product |
| COD fee mismatch (₹39 vs admin ₹50) | Settings table | Medium | Uses admin value — **confirm** | No surprise charges |
| One-of-One stock 5 and 10 | Product data | Medium | **Owner: fix in admin** | Exclusivity credibility |
| No consent banner | None in code | Medium | **Owner decision** | Compliance |
| `provision-customer` creates accounts for any email | Public function | Low–Med | Still used by sign-up; add rate limits or merge into checkout | Abuse risk |

**No conversion improvement is claimed.** Measure using §H once tracking is live.

---

## Files changed
- Server: `supabase/functions/_shared/orders.ts` (new), `place-cod-order/` (new), `cashfree-order`, `cashfree-verify`, `cashfree-webhook`, `supabase/security_lockdown_migration.sql` (new), `supabase/tracking_settings_migration.sql`.
- Storefront: `CartContext`, `AuthContext`, `ProductContext` (weight, featured), `lib/tracking.js`, `GoogleAnalytics`, `Header`, `ProductCard`, `WhatsAppButton`, `Home`, `Shop`, `ProductDetail`, `Checkout`, `PaymentVerify`, `OrderSuccess`, `Contact`, `Account/tabs/WishlistTab` + their CSS.
