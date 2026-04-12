# 💡 Feature Requests — Komic Freaks Studio

> Capture ideas here before building. Don't code it — log it first!

---

## Template

```
### Feature Name
- **Priority:** High / Medium / Low
- **Description:** What does it do?
- **Why:** Why does the channel need this?
- **Effort:** Small / Medium / Large
- **Status:** Idea / Planned / In Progress / Done
```

---

## Ideas

### YouTube Direct Upload
- **Priority:** Medium
- **Description:** Upload finished videos directly to YouTube from the app
- **Why:** Saves time switching between apps
- **Effort:** Medium (requires YouTube API OAuth)
- **Status:** Idea

### TikTok / Reels Export
- **Priority:** High
- **Description:** One-click export in 9:16 vertical format for TikTok and Instagram Reels
- **Why:** Multi-platform posting grows the audience faster
- **Effort:** Medium
- **Status:** Idea

### Figure Database Integration
- **Priority:** Low
- **Description:** Connect to MyFigureCollection to auto-pull figure details, images, pricing
- **Why:** Auto-generate info cards and comparison data
- **Effort:** Large
- **Status:** Idea

### AI Video Descriptions
- **Priority:** Medium
- **Description:** Auto-generate YouTube descriptions, tags, and titles from video content
- **Why:** SEO optimization without effort
- **Effort:** Small
- **Status:** ✅ Planned → Moved to AI Layer (#2 AI Metadata Generator)

---

## 🤖 AI Intelligence Layer — Video Editor

### AI Script Writer
- **Priority:** High
- **Description:** Pick a template (Figure Review, Unboxing, Top 5) + enter figure name → AI generates a full narration script in seconds. Script flows directly into ElevenLabs narration pipeline.
- **Why:** Removes the hardest part of content creation. Script → Voice → Timeline in one flow.
- **Effort:** Small (GPT-4o-mini API, add button to Narration panel)
- **Cost:** ~$0.001 per generation
- **Status:** Planned

### AI Video Metadata Generator
- **Priority:** High
- **Description:** After export, AI generates SEO-optimized YouTube title, 300-word description, 30 tags, and hashtags based on project name, template, and narration script.
- **Why:** SEO is the #1 growth lever for small YouTube channels. Nobody does it well manually.
- **Effort:** Small (GPT-4o-mini, new section in Export modal)
- **Cost:** ~$0.002 per generation
- **Status:** Planned

### AI Edit Copilot
- **Priority:** High
- **Description:** Persistent chat sidebar inside the editor. User asks natural language questions like "make the intro more dramatic" or "cut this to 60 seconds" → AI suggests and executes edits via function calling.
- **Why:** The Copilot for video editing. No other browser-based editor has this. Defining feature.
- **Effort:** Medium-Large (GPT-4o function calling + chat UI + action dispatch)
- **Cost:** ~$0.02 per conversation turn
- **Status:** Planned

### AI Thumbnail Generator (Enhanced)
- **Priority:** Medium
- **Description:** Upgrade existing thumbnail panel with AI-generated backgrounds (DALL-E 3), clickbait-optimized title suggestions, and auto-frame selection from video.
- **Why:** Thumbnails are 80% of click-through rate. AI makes them stunning.
- **Effort:** Medium (DALL-E 3 API + extend existing component)
- **Cost:** ~$0.04 per thumbnail
- **Status:** Planned

### AI Voice Clone
- **Priority:** Medium
- **Description:** Clone the creator's voice via ElevenLabs Professional Voice Cloning. Record 30 seconds → AI narrates any script in their voice.
- **Why:** Authentic branding. Channel literally sounds like the creator even on off days.
- **Effort:** Small (ElevenLabs API exists, need upload/training UI)
- **Cost:** Requires ElevenLabs paid plan (~$5/month)
- **Status:** Planned

### AI Auto-Edit (One-Click Edit)
- **Priority:** Low
- **Description:** Import raw footage → AI does everything: auto-cut silence, add transitions, pick background music, generate captions, create title card + outro.
- **Why:** The holy grail. Import → Export. Zero editing required.
- **Effort:** Large (orchestration layer chaining all existing services)
- **Cost:** Aggregated from sub-services
- **Status:** Idea (depends on all edit features being complete)

### AI Smart B-Roll
- **Priority:** Low
- **Description:** AI detects when narrator mentions a specific character/moment → auto-inserts relevant anime clips or images from the clip library.
- **Why:** Professional-quality B-roll insertion without manual work.
- **Effort:** Large (clip library tagging + scene understanding)
- **Status:** Idea (depends on tagged clip library)

---

## 🤖 AI Intelligence Layer — SHF Vault

### AI Figure Lore Cards
- **Priority:** High
- **Description:** Tap any figure → "AI Lore" button generates character backstory, first anime appearance, notable battles, power level, fun facts.
- **Why:** Turns a boring inventory app into an encyclopedia. Collectors love trivia.
- **Effort:** Small (GPT-4o-mini with franchise knowledge prompt)
- **Cost:** ~$0.001 per card
- **Status:** Planned

### AI Bootleg Detector
- **Priority:** High
- **Description:** Upload photo of a figure → Vision AI analyzes paint quality, joint type, box art, logos → Legit Score (0–100%) with specific red flag callouts.
- **Why:** SHF is one of the most bootlegged lines. Genuine premium feature collectors would pay for.
- **Effort:** Medium (camera/upload UI + GPT-4o vision API)
- **Cost:** ~$0.02 per scan
- **Status:** Planned

### AI Collection Insights
- **Priority:** Medium
- **Description:** AI analyzes user's entire collection and generates: natural language summary, investment advice ("SS4 Gogeta appreciated 340%"), completion suggestions, sell recommendations.
- **Why:** Transforms passive inventory into active investment intelligence.
- **Effort:** Medium (feed collection JSON to GPT-4o-mini)
- **Cost:** ~$0.005 per analysis
- **Status:** Planned

### AI Price Predictor
- **Priority:** Medium
- **Description:** Based on release date, exclusivity, character popularity, and anime release schedule → predict whether a figure's value goes up or down.
- **Why:** Turns collectors into investors. Massive engagement hook.
- **Effort:** Medium (requires historical price data from Triple-Source Pricing Engine)
- **Status:** Idea (blocked by Phase 4 Pricing Engine)

### AI Trade Advisor
- **Priority:** Low
- **Description:** Input two figures → AI compares market value, rarity, condition, trend → recommends accept/decline trade.
- **Why:** Fair trade verification builds trust in marketplace.
- **Effort:** Medium (requires live pricing data)
- **Status:** Idea (blocked by Phase 4 Pricing Engine)

---

## 🗄️ SHF Vault — Feature Requests

> Full spec: `docs/SHF_VAULT_SPEC.md`

### Barcode Scanner (Box Scanner)
- **Priority:** High
- **Description:** Use phone camera to scan UPC barcode on SHF box, auto-add to collection
- **Why:** Removes manual entry friction — the #1 reason people stop using tracking apps
- **Effort:** Medium (camera API + barcode lookup DB)
- **Status:** Planned (Phase 2)

### Insurance Report Generator
- **Priority:** High
- **Description:** One-tap PDF export of collection with current market values and photos for home insurance
- **Why:** Massive "Premium" selling point — collectors need documented asset lists for insurance
- **Effort:** Medium (PDF generation + value calculation)
- **Status:** Planned (Phase 4 — Premium)

### Replacement Part Tracker
- **Priority:** Medium
- **Description:** Track missing accessories per figure (hands, heads, effect parts) — affects resale value
- **Why:** SHF figures come with 10+ accessories, missing one drops value significantly
- **Effort:** Small (free-text notes + checklist per figure)
- **Status:** Planned (Phase 2)

### Triple-Source Pricing Engine
- **Priority:** High
- **Description:** Combine Live Scraper (eBay/Mercari), Manual Curator, and Community Consensus for market pricing
- **Why:** Creates the most trustworthy price data in the hobby — the "Price Confidence Score"
- **Effort:** Large (API integrations + curation workflow + community input)
- **Status:** Planned (Phase 4)

### Community Legit Check
- **Priority:** Low
- **Description:** Community area where users submit photos to get authenticity checks from experienced collectors
- **Why:** SHF is one of the most bootlegged lines — builds trust and engagement
- **Effort:** Large (community moderation, photo uploads, voting)
- **Status:** Idea (Phase 5)

### Internal Marketplace
- **Priority:** Low
- **Description:** Users buy/sell/trade figures directly in-app with transaction fees (3-5%)
- **Why:** High profit potential, solves a real problem for collectors
- **Effort:** Very Large (payments, escrow, disputes, legal)
- **Status:** Idea (Phase 5)

### Grail of Grails Annual Awards
- **Priority:** Low
- **Description:** Annual community vote for the most sought-after figures, with anti-spam measures
- **Why:** Builds community engagement and creates buzz
- **Effort:** Medium
- **Status:** Idea (Phase 5)

### Pre-Order Waitlist & Restock Alerts
- **Priority:** Medium
- **Description:** If user misses a pre-order, "Waitlist" button notifies them on retailer restock
- **Why:** Pre-order windows close fast — collectors need a safety net
- **Effort:** Medium (retailer monitoring + push notifications)
- **Status:** Idea (Phase 4)

