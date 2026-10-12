# AGENTS.md — how we build Komic Freaks

One rulebook for every AI that works here (Claude, Codex, anyone). Part of the Command Deck Kit.
Keep it short. If a rule here clashes with a habit, the rule wins.

## 1. Talking to Zakariya
Zakariya is the owner. He is dyslexic, not a developer, and long words put him off.
- Short everyday words. Short sentences. The answer first.
- Lists and numbered steps, one action each. Bold the key bit.
- Explain any tech word in brackets the first time.
- Ask **one question at a time**, with **2–4 choices to tap**, your recommended one first.
- Never correct his spelling. End with what he can say next ("say **go**").

## 2. How we work (the loop)
Every piece of work goes round this loop. Don't skip steps.

1. **Grill** — before any plan, run `/grill-me`: questions one at a time, each with a suggested answer, until we share the same picture.
2. **Spec** — write the agreed picture into `SPEC.md`: goal, who it's for, must do, won't do, tricky cases, what "done" means.
3. **Jobs** — split the spec into **small jobs** on `PROJECT_BOARD.md`. Each job is one thing a person can see and test.
4. **Lane** — each job gets its own lane (its own branch and copy). Never work straight on `main`.
5. **Build with tests** — logic (money, dates, logins, data) is built test-first.
6. **Checks** — `flutter analyze` clean, `flutter test` green, no secrets, design rules kept.
7. **On track?** — halfway, and again before saying done, run `/on-track`. It checks the work still matches `SPEC.md` and this rulebook.
8. **Fresh review** — a different AI session reviews the change like a strict outsider. The builder never marks its own homework.
9. **Zakariya's OK** — show what changed in plain words, with before/after screenshots for anything he can see.
10. **Ship** — only after his OK. Never go live, merge to `main`, or publish to a store by yourself.

## 3. Flutter rules
- **State:** Riverpod. **Navigation:** GoRouter. **Backend:** Supabase.
- **Look:** colours, spacing and text styles come from the design tokens (theme). No hard-coded colours. No purple or violet.
- **Size:** a screen or widget file stays under **300 lines**. Split it when it grows.
- **Text:** no hard-coded user-facing strings in widgets when the app has translations.
- **Access:** tap targets at least 48×48, labels for screen readers (Semantics), readable contrast.
- **Offline:** the app must not crash or go blank without internet. Show a friendly message.
- **Credit:** the splash and the About/Settings screen say exactly **"Brought to you by Deploy & Enjoy"**.

## 4. Data and safety
- Every Supabase table has **Row Level Security** from day one.
- Database changes go in **migrations**, never by hand on the live database.
- **Never** commit secrets (`.env`, `dart_defines*.json`, keys, keystores). Check before every commit.
- **Never** delete real data, or change live data, without asking first.
- Test on the practice/training database, never on live student or client data.

## 5. What "done" means
- [ ] Does what `SPEC.md` says, and nothing it says not to
- [ ] `flutter analyze` has no errors; tests pass; new logic has tests
- [ ] `/on-track` says on track
- [ ] Fresh review passed
- [ ] `PROJECT_BOARD.md` and `HANDOFF.md` updated
- [ ] Zakariya said OK

## 6. Files in every project
| File | What it's for |
|---|---|
| `AGENTS.md` | This rulebook |
| `SPEC.md` | What we're building and why (from `/grill-me`) |
| `PROJECT_BOARD.md` | The jobs: To do · In progress · Done · Ideas |
| `DECISIONS.md` | Big choices and why we made them |
| `HANDOFF.md` | Where we are, so the next session can carry on |
| `audits/` | Reports from `/on-track` |
| `CLIENT-QUESTIONS.md` / `SIGN-OFF.md` | For client projects: questions before, sign-off after |

## 7. About this project
- **What it is:** Komic Freaks Studio, a video editor in the browser for the Komic Freaks anime and figure channel.
- **Does:** cut clips, add sound effects, voice-over and thumbnails, then export.
- **Who it's for:** the Komic Freaks YouTube channel.
- **Stack:** React + Vite web app, with a small Cloudflare Worker (`worker/`) for audio.
