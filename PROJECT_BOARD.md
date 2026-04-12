# 📋 Komic Freaks Studio — Project Board

> Last updated: 2026-04-12

---

## ✅ Done

- [x] Project planning & implementation plan
- [x] Git init + .gitignore
- [x] README.md + docs (FEATURE_REQUESTS, QUICK_START, guidance)
- [x] Vite + React scaffold + dark anime design system
- [x] Editor layout (sidebar, timeline, preview, vertical tool strip)
- [x] File import (drag & drop for MP4, MOV, MP3, WAV, JPG, PNG)
- [x] Video preview player (segment-aware)
- [x] Basic timeline (clips, trim, reorder, drag, resize)
- [x] Video export modal (MP4 format selection)
- [x] Keyboard shortcuts (Space=Play, Z=Undo, Delete=Remove, etc.)
- [x] AI Auto-Cut (silence detection, waveform, one-click apply)
- [x] Multi-track volume mixer (per-track sliders + mute)
- [x] Project persistence (localStorage + IndexedDB blob persistence)
- [x] Anime SFX library (24 synthesized sounds, preview + add to timeline)
- [x] Custom SFX Upload (WAV/MP3 upload, preview, add to timeline)
- [x] ElevenLabs narration panel (script editor, voice selection, Browser TTS fallback)
- [x] Thumbnail generator panel (6 presets, frame capture, quick titles, stickers)
- [x] Templates system (Figure Review, Unboxing, News, Comparison)
- [x] Notification toast system
- [x] Undo/Redo system (50-level history stack + ⌘Z/⌘⇧Z)
- [x] Background music library (6 synthesized ambient tracks)
- [x] Audio Engine (real-time playback sync for SFX, music, narration)
- [x] Audio Ducking (auto-lower music during narration, adjustable 5%-50%)
- [x] Multi-track export pipeline (FFmpeg filter graph mixing all audio + video)
- [x] Export track summary badges + muted track warnings
- [x] Captions & text overlay system (6 presets, position/alignment controls, live preview)
- [x] Caption burn-in during FFmpeg export (drawtext filters)
- [x] Transition system (7 types: Fade, Crossfade, Wipe, Zoom, Slide Up)
- [x] Transition preview CSS animations in video player
- [x] Auto-Captions (Web Speech API + OpenAI Whisper cloud API)
- [x] Cloud AI Captions — 90+ languages, Original/English/Both modes
- [x] Cloud AI Captions — track source selector (Video, Audio, Narration, SFX)
- [x] Anime Clip Extractor (YouTube audio, waveform scrubber, clip library)
- [x] AI Vocal Isolation (Demucs integration)
- [x] Agent infrastructure (7 agents, 6 workflows)
- [x] Deployment configs (vercel.json, netlify.toml, COOP/COEP headers)
- [x] GitHub remote (zakariyayahiaoui-hub/KomicFreaks) + pushed

---

## 🔄 In Progress

- [ ] VN Editor feature parity (see gap analysis below)
- [ ] **🗄️ SHF Vault** — Action figure collection manager (sister app within Komic Freaks platform)
  - 📄 Full spec: `docs/SHF_VAULT_SPEC.md`

  **Phase 1: The Brain (Database & Schema)**
  - [ ] Platform shell refactor (hub/studio/vault routing)
  - [ ] Design & implement `figures` table (name, franchise, arc, release_type, body_spec, accessories, images, barcode, status)
  - [ ] Design & implement `user_inventory` table (condition, purchase_price, store, date_acquired, badges, missing_parts_notes)
  - [ ] Design & implement `series_sets` table (pre-defined saga sets with completion_mode toggle)
  - [ ] Design & implement `wishlist` table (priority levels, grail/quest badges)
  - [ ] Design & implement `sold_archive` table (history archive for sold/traded figures, profit/loss)
  - [ ] Vault Store (Zustand) + IndexedDB persistence
  - [ ] Seed initial Dragon Ball SHF dataset (test set)

  **Phase 2: The Vault (Collection Management)**
  - [ ] Catalog UI — Franchise grid (default home screen) with figure profiles
  - [ ] Figure Profile Page — full details (Release Type, Body Spec, Accessory Checklist, official photo gallery)
  - [ ] Variants as separate entries (Best Selection, Event Exclusive, Colour Swap = different catalog items)
  - [ ] Sort toggle: Franchise (default) ↔ Release Date (chronological timeline)
  - [ ] Filter system: Franchise, Release Year, Released/To-Be-Released, Exclusive, Set
  - [ ] Search-and-Tap — search character name → pick variant → add to vault
  - [ ] Barcode Scanner — phone camera scans UPC → auto-lookup & add
  - [ ] Mass Add (Saga Check-off) — go to set → check all / select multiple
  - [ ] Condition tracking (deep): MISB, Opened/Displayed, No Box, Box Damage, Brown Shipper Box
  - [ ] Badge system: Owned, Quest (hunting), Grail (crown jewel)
  - [ ] Digital Shelf — Retail Grid layout with official product photos
  - [ ] Box Art vs Figure Toggle (awaiting user decision: Dynamic Swap / Tap Effect / Status-Based)
  - [ ] Accessory & parts tracking (official checklist + user "Notes" for missing parts)
  - [ ] Investment tracking: Price Paid, Store, Purchase Date per figure
  - [ ] Profit/Loss portfolio summary ("You spent $X, collection worth $Y")
  - [ ] Sold/Trade Archive — move figures to "History" (not delete), preserve lifetime P/L

  **Phase 3: The Completionist (Saga Tracking)**
  - [ ] Pre-defined "Mini-Sets" (Ginyu Force, Avengers, etc.) with completion bars — FREE
  - [ ] Custom user-created sets — PAID subscription
  - [ ] Completion Level Toggles: Passive / Standard / Die-Hard
  - [ ] Visual completion progress bar per set ("7/10 collected")

  **Phase 4: The Wallet (Monetisation & Financial)**
  - [ ] Grail Calculator / Wishlist: Grand Total, Priority Breakdown (High/Low), Savings Goal
  - [ ] Monthly Toy Budget tracker ("X months to save for your Grails")
  - [ ] Triple-source pricing: Live Scraper (eBay/Mercari) + Manual Curator + Community Consensus
  - [ ] Affiliate links: "Buy Now" on figure profiles (eBay, Amazon, AmiAmi, Hobby Genki)
  - [ ] Premium subscription paywall: custom photos, custom sets
  - [ ] Authenticity section: Side-by-side Real vs. Bootleg photo gallery per figure
  - [ ] Release Calendar: sorted list + phone calendar integration + countdown timers
  - [ ] Daily Digest notifications (FREE): daily summary of wishlist items available
  - [ ] PDF Insurance Report export (premium)

  **Phase 5: The Pulse (Community — Future, post critical mass)**
  - [ ] Public profile sharing (see other people's collections)
  - [ ] Annual "Grail of Grails" community voting
  - [ ] Community "Legit Check" area (photo submissions for authenticity)
  - [ ] Internal marketplace with "For Sale/Trade" status
  - [ ] Transaction fees (3-5%) on marketplace sales
  - [ ] "Trusted Collector" verified seller badge
  - [ ] Push notifications for pre-order windows & restocks

---

## 📝 To Do — VN Feature Parity

> Goal: match every feature in VN Video Editor

### High Priority (Core Editing)
- [ ] **Speed control** — slow-mo (0.25x-0.5x) and fast forward (2x-4x) per clip
- [ ] **Split clip** — split at playhead position (razor tool)
- [ ] **Aspect ratio presets** — 16:9, 9:16, 1:1, 4:5, 4:3 with preview
- [ ] **Crop & Rotate** — per-clip crop, rotate 90°/180°/270°, flip H/V
- [ ] **Duplicate clip** — quick duplicate on timeline

### High Priority (Visual Effects)
- [ ] **Filters** — preset color filters (Warm, Cool, Vintage, B&W, Anime, etc.)
- [ ] **Color adjustments** — brightness, contrast, saturation, exposure per clip
- [ ] **Elements/Stickers** — animated overlays, shapes, emoji stickers
- [ ] **Picture-in-Picture** — overlay a second video on top of main

### Medium Priority
- [ ] **Chroma key (green screen)** — remove green/blue background
- [ ] **Reverse video** — play clip backwards
- [ ] **Keyframe animation** — animate scale, position, opacity over time
- [ ] **Mirror/Flip** — horizontal/vertical flip
- [ ] **Cover/Thumbnail** — set video cover from frame selection

### Phase 8: Ship
- [ ] Deploy to Vercel/Netlify
- [ ] Tutorial walkthrough for nephew

---

## 💡 Backlog

- [ ] YouTube API integration (direct upload)
- [ ] TikTok format export (9:16 vertical)
- [ ] Instagram Reels export
- [ ] Batch processing (multiple videos)
- [ ] Custom intro/outro animations
- [ ] Figure database integration (MyFigureCollection API)
- [ ] AI-generated video descriptions & tags
- [ ] Project cloud sync (Supabase)
