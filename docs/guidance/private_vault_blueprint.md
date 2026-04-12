# 🏆 The Private Vault — S.H. Figuarts Collector App Blueprint

> Captured: 2026-04-12
> Status: Blueprint — Not yet started

---

## Project Overview

A premium, secure collection management tool designed specifically for S.H. Figuarts collectors. The app focuses on cataloging (The Vault), market tracking (Grail Hunting), and community-driven verification (Legit Checks).

---

## Phase 1: Core Engine (The MVP)

### 1.1 Figure Database & UI
- [ ] Retail Grid Layout — clean, high-res grid inspired by retail displays
- [ ] Toggle System — each figure has binary status: "Owned" vs "Wishlist"
- [ ] Visual Motivation — Wishlist = Grey-scale → Owned = Full Color
- [ ] Quantity Counter — "Army Builder" support (x2, x5) on thumbnails
- [ ] Digital Manuals — free library of official instruction scan PDFs/Images

### 1.2 The Private Vault (Inventory)
- [ ] Status Flags — "On Display," "In Storage," or "For Sale"
- [ ] Storage Tracking — text fields for Bin numbers or Shelf names
- [ ] Basic Stats — total figure count + "Portfolio Value" based on MSRP

### 1.3 News & Alerts
- [ ] Triple Feed — Global News, Customized News (by franchise), "Leak" Section
- [ ] Dual-Date Calendar — Japan (Import) vs Global (Domestic) release dates

---

## Phase 2: Premium Tier ("Vault Master" Subscription)

### 2.1 Market Intelligence & Financials
- [ ] Live Market Tracker — real-time aftermarket values + price history graphs
- [ ] Grail Hunter Alerts — push notifications for price drops / "Trending Up"
- [ ] Insurance Report — one-click PDF export (values + "Owned" badges)
- [ ] Savings Progress Bar — visual tracker for saving toward expensive Grails

### 2.2 Advanced Organization & Security
- [ ] Access Control — Standard Login or Biometric Lock (FaceID/Fingerprint)
- [ ] Ghost Vault — secondary "Fake PIN" opens blank/decoy vault
- [ ] Missing Parts Checklist — mark accessories/hands/faces as "Missing"
- [ ] Condition Tracking — high-res photo uploads of box corners and seals

### 2.3 Pro-Collector Tools
- [ ] Barcode Scanner — verify authenticity vs known bootlegs
- [ ] Listing Generator — auto-generate eBay/Mercari text from specs + condition
- [ ] Compatibility Matrix — head-swap and effect-part compatibility data
- [ ] Fragility Warnings — known breakage points (e.g. "Fragile wrist pegs")

---

## Phase 3: The Verified Community (Premium Only)

- [ ] Message Board — repair tips and hobby discussion forum
- [ ] Q&A Hub — structured "Legit Check" verification area
- [ ] Showcase Feed — gallery for custom "Pose Library" photos
- [ ] Contact Seller — private message bridge for "For Sale" items (no in-app transactions)

---

## Technical Constraints & Logic

| Rule | Detail |
|------|--------|
| No Scalper Data | Public rarity counts / "most wishlisted" stats DISABLED |
| Privacy First | User data 100% private unless user opts into public "Collector Title" |
| Monetization | Free: Cataloging, News, Manuals, MSRP • Premium: Market Data, Security, Community, Barcode, Insurance |

---

## Tech Stack (Proposed)

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) or React Native (mobile-first) |
| Backend | Supabase (auth, database, storage, edge functions) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth + Biometric (mobile) |
| Push Notifications | Supabase Edge Functions + FCM |
| Market Data | Web scraping service or partner API |
| Barcode | Mobile camera + barcode lookup API |
| Payments | Stripe / RevenueCat (subscriptions) |
