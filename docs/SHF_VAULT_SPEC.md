# 🏛️ SHF Vault — Complete Feature Specification

> Distilled from Socratic Discovery Session (2026-04-12)
> Source: Gemini AI brainstorm — 17 questions answered

---

## 🎯 Vision

A **Private Vault** and **Digital Archive** for S.H. Figuarts collectors. The app starts with SHF figures only, then expands to other brands (Marvel Legends, Mafex, etc.) once the "frame" is established. The long-term vision includes community features and monetisation.

---

## 📐 Database Schema (The "Brain")

### `figures` — Global Library (Master Catalog)
| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `name` | Full figure name (e.g., "Super Saiyan Son Goku - Legendary Super Saiyan") |
| `franchise` | Dragon Ball, Naruto, Marvel, Star Wars, etc. |
| `sub_line` | Shinkocchou Seihou, Premium Bandai, etc. |
| `arc` | Namek Saga, Cell Saga, etc. |
| `release_date` | For the "Coming Soon" calendar |
| `msrp` | Original retail price (Yen/USD) |
| `current_market_value` | Updated from triple-source pricing |
| `status` | "Released", "Pre-order", "Announced" |
| `release_type` | General Distribution / Premium Bandai / Event Exclusive / Store Exclusive / Best Selection / Premium Colour |
| `body_spec` | 1.0, 2.0, 3.0 joint system |
| `accessories` | JSON list of included accessories (hands, heads, effect parts) |
| `image_urls` | Array of official product photos |
| `barcode_upc` | For barcode scanner lookup |
| `bootleg_exists` | Boolean flag for known bootleg risk |
| `bootleg_guide` | Side-by-side real vs. bootleg photo gallery |

### `user_inventory` — The Vault
| Field | Description |
|-------|-------------|
| `user_id` | Owner |
| `figure_id` | FK to figures table |
| `condition` | MISB / Opened-Displayed / No Box / Box Damage / Includes Brown Shipper Box |
| `purchase_price` | What the user actually paid |
| `store_purchased_from` | e.g., "AmiAmi", "Local Toy Store" |
| `date_acquired` | When they got it |
| `badges` | Array: "owned", "quest", "grail" |
| `missing_parts_notes` | Free-text notes on what's missing |
| `user_photos` | Custom photos (PREMIUM feature) |

### `series_sets` — Completionist Tracker
| Field | Description |
|-------|-------------|
| `id` | Set identifier |
| `name` | e.g., "Ginyu Force", "Avengers" |
| `figure_ids` | List of figure IDs in this set |
| `completion_mode` | "passive" / "standard" / "die_hard" toggle |

### `wishlist` — The Hunt
| Field | Description |
|-------|-------------|
| `user_id` | Who wants it |
| `figure_id` | Which figure |
| `priority` | "high" / "low" |
| `badge` | "grail" or "quest" |

### `sold_archive` — History
| Field | Description |
|-------|-------------|
| `user_id` | Who sold it |
| `figure_id` | Which figure |
| `sold_price` | What they got for it |
| `sold_date` | When |
| `original_purchase_price` | For profit/loss calculation |

---

## 🧭 Navigation & Sorting (Q3, Q10)

### Primary Sort: **Franchise** (default home screen)
- Dragon Ball, Naruto, Marvel, Star Wars, etc.
- Each franchise opens to show all figures within it

### Secondary Sort Toggle:
- **Release Date** (chronological timeline of every SHF ever released)
- User can switch view preference

### Filters (FREE for everyone):
- Franchise
- Release Year
- Released / To Be Released
- Exclusive (P-Bandai, Event, Store)
- Set (links to completionist tracker)

---

## 🎮 Core Features

### 1. Catalog Skeleton (The Archive) — Q1, Q2
- Every SHF figure listed with full profile
- Profile includes: Release Type, Body Spec, Accessory Checklist, official photos gallery
- **Variants are SEPARATE entries** (Best Selection, Event Exclusive, Colour Swap = different entries)
- Regional differences (Bluefin sticker vs JP release) are NOT separate — tracked as info within the profile, with user photos
- Names in English, Japanese Kanji/Katakana can be included in the info

### 2. Data Entry (FREE for all) — Q7
- **Search-and-Tap**: Search character name → pick variant → add
- **Barcode Scanner**: Phone camera scans UPC on box → auto-add
- **Mass Add (Saga Check-off)**: Go to a set → check all/select multiple at once

### 3. Completionist Tracker — Q4, Q15
- **Pre-defined sets** (Ginyu Force, Avengers, etc.) = FREE
- **Custom sets** = PAID subscription
- **Completion Level Toggles**:
  - 🟢 Passive: "One of each character to represent the saga"
  - 🟡 Standard: "Every unique sculpt/version, skip 1.0 if I have 3.0"
  - 🔴 Die-Hard: "Every single box variant, event exclusive, and color swap"

### 4. Badge System — Q8
- **Owned Badge**: Confirms figure is secured in vault
- **Quest Badge**: In-between stage (ordered, hunting at specific price)
- **Grail Badge**: Crown jewel of the collection

### 5. Digital Shelf (My Collection View) — Q9
- **Retail Grid** layout (clean, identical squares) = default
- Official product photos as thumbnails
- Users can upload own photos = PAID feature

### 6. Box Art vs Figure Toggle — Q17
- **Decision needed**: Options presented were:
  - A) Dynamic Swap (app-wide toggle for Product Poses vs Box Art)
  - B) Hover/Tap Effect (figure pose default, tap-and-hold = flip to box)
  - C) Status-Based Auto-Image (MISB items automatically show box art)
- **Status: AWAITING USER ANSWER** ⏳

### 7. Condition Tracking (Deep) — Q3
- MISB (Mint in Sealed Box)
- Opened / Displayed
- No Box
- Box Damage
- Includes Brown Shipper Box
- Affects "Collection Value" calculation

### 8. Accessory & Parts Tracking — Q6
- Figure profile shows full official accessory checklist
- User has free-text "Notes" section to document missing parts
- Missing parts affect value calculation

### 9. Authenticity Section — Q14
- **Side-by-Side gallery**: Real vs. Known Bootleg photos for each figure
- Separate section (not cluttering main vault)
- Warning flags on figures with known high-quality bootlegs
- Future: Community "Legit Check" area

---

## 💰 Financial Features

### 10. Grail Calculator / Wishlist — Q5, Q13
- **Grand Total**: One big number showing total cost of all wishlist figures
- **Priority Breakdown**: "High Priority" vs "Low Priority" budget tiers
- **Savings Goal**: Set monthly toy budget → app shows how long to save for Grails

### 11. Price Source — Triple-Check System — Q5
1. **Live Scraper**: Pull average "Sold" prices from eBay/Mercari (Real-Time)
2. **Manual Curator**: You filter out noise (bootleg listings, scams)
3. **Community Consensus**: Users report prices, app averages

### 12. Currency Support — (to be confirmed)
- Auto-convert to local currency (UK, Japan, etc.)

### 13. Condition-Based Pricing — (to be confirmed)
- Sealed = 100%, OOB = ~60%, adjust automatically

### 14. Investment Portfolio — Q11
- Track: **Price Paid**, **Store**, **Purchase Date**
- **Profit/Loss Summary**: "You spent $2,000, collection now worth $3,500"
- Financial portfolio-style growth tracking

### 15. Sold/Trade Archive — Q12
- Figures moved to "History Archive" (not deleted)
- Lifetime profit/loss preserved
- Future: "For Sale" status → alerts other users

---

## ⏰ Release Calendar & Alerts — Q7 (Release Calendar)

### 16. Coming Soon Section
- **Simple list** sorted by date
- **Phone calendar integration** (add Pre-order Day as event)
- **Countdown Timer** for most anticipated figures
- Affiliate link placement under countdown timers

### 17. Grail Alert / Notifications — Q16
- **Daily Digest** (FREE): Single daily summary of wishlist items available
- Future premium options: Real-time alerts, Deal Finder

### 18. Waitlist Feature — (to be confirmed)
- If user misses pre-order → "Waitlist" button → notify on restock

---

## 💳 Monetisation Strategy

### Free Tier
- Unlimited catalog browsing
- Collection tracking (search, barcode scan, mass add)
- Pre-defined set completion tracking
- All filters
- Official product photos as thumbnails
- Daily Digest alerts
- Badge system (Owned, Quest, Grail)
- Profit/Loss tracking
- Release calendar + countdown timers + calendar integration

### Premium Subscription (~$2.99/mo)
- Custom sets for completionist tracker
- Custom user photos for collection items
- (More features TBD — user wants flexibility to adjust later)

### Affiliate Revenue
- "Find It" / "Buy Now" links on figure profiles (eBay, Amazon, AmiAmi, Hobby Genki)
- Commission on purchases via affiliate links
- Positioned under countdown timers and on wishlisted figures

### Future Revenue
- Transaction fees on internal marketplace (3-5%)
- "Trusted Collector" verified seller badge
- PDF Insurance Reports (premium export)

---

## 🌐 Community Features (Phase 5 — Future, post critical mass)

- Public profile sharing ("see other people's collections")
- Annual "Grail of Grails" voting (anti-spam measures TBD)
- Community Legit Check area (photo submissions)
- "For Sale/Trade" marketplace
- User profile visibility settings (vault visuals only, or include $ value)

---

## 📱 UX Decisions

### Offline Mode — (to be confirmed)
- "My Collection" works offline (prevent duplicate buys at Toy Cons)

### Dark Mode — (to be confirmed)
- Default dark theme to make colorful figure photos pop

### Default Shelf Organization — (to be confirmed)
- Within franchise: by Character Name (A-Z) or by Release Number

---

## 🏗️ Phased Build Plan

| Phase | Focus | Key Features |
|-------|-------|-------------|
| 1. The Brain | Database Setup | Global Library for SHF with Release Type, Body Spec, Accessories |
| 2. The Vault | Collection Management | Search & Add, Barcode Scanner, Mass Add, Sorting (Franchise + Release Date toggle) |
| 3. The Completionist | Saga Tracking | Pre-defined sets with completion bars, 3-tier completion mode |
| 4. The Wallet | Monetisation | Grail Calculator (Wishlist), Affiliate links, Paywall for custom photos/sets |
| 5. The Pulse | Community (Future) | Yearly voting, Grail awards, public profiles, marketplace |

---

## ⏳ Open Questions (Still Unanswered)

1. **Q17 — Box Art Toggle**: How should the primary image behave? (Dynamic Swap / Tap Effect / Status-Based Auto-Image)
2. **Currency Support**: Auto-convert to local currency?
3. **Condition-Based Pricing**: Auto-adjust value by condition?
4. **Offline Mode**: Should My Collection work offline?
5. **Dark Mode default**: Confirmed? (likely yes given project rules)
6. **Default sort within franchise**: A-Z by character or by release number?
7. **Waitlist feature**: Include for missed pre-orders?
8. **User profile visibility**: Vault only or include collection value?
9. **Anti-spam voting**: How to prevent vote manipulation for Grail of Grails?
