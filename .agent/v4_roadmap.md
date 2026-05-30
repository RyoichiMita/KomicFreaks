# An-Nakhlah Hub V4 Migration Roadmap

> **Objective:** Transition the app to a scalable, "Feature-First" architecture using Riverpod and Supabase Edge Functions, without breaking the existing V3 functionality.

## 🏗️ Phase 1: Foundation (Current)
- [x] Add `flutter_riverpod` dependency.
- [ ] Wrap `runApp` with `ProviderScope`.
- [ ] Create `lib/features` directory structure.
- [ ] Create `lib/core/v4` specific utilities (e.g. `supa_client_provider`).

## 🚀 Phase 2: Pilot Feature (Quiz Progress)
- [ ] Create `lib/features/quiz` (Data/Domain/Presentation).
- [ ] Create `quiz_repository_provider` (Riverpod).
- [ ] Create `quiz_analysis_provider` (Riverpod Service).
- [ ] Refactor `ProgressReportTab` to use `ConsumerWidget`.
- [ ] Verify functionality (Port 65116).

## 📡 Phase 3: Server-Side AI (Scalability)
- [ ] Draft `supabase/functions/analyze-quiz/index.ts`.
- [ ] Create simple client-side wrapper to call this function.
- [ ] Replace local `Gemini` call with Edge Function call.

## 📦 Phase 4: Expansion
- [ ] Migrate `Auth` module to Riverpod.
- [ ] Migrate `Lessons` module to Riverpod.
- [ ] Replace `Navigator` with `GoRouter`.

## 🛠️ Principles
1.  **Do No Harm:** Existing code stays until the new replacement is proven.
2.  **Vertical Slices:** Migrate one full feature at a time.
3.  **Compile Safety:** Prefer Riverpod constraints over GetIt runtime lookups.
