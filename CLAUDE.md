# CLAUDE.md — Poker Trainer

> This is the project reference doc. Claude Code reads it automatically each session.
> It defines what we're building and the rules for building it. Below the conventions
> is the full master spec.

## Working conventions (read every session)
- **Build one module per prompt.** Never "build the app." Build exactly one piece, then stop.
- **Follow the build order in Section 6.** Foundations first, then the range trainer, etc.
- **Tight, clean, scalable code. Zero patchwork.** Each module is self-contained and reads
  from shared `/engine`, `/data`, `/store`. Don't duplicate logic across modules.
- **I review every diff before it's committed.** Make changes small enough to review.
- **Correctness-critical parts** (range-chart data, equity math) get extra care — flag them
  for me to verify.
- **Don't scan the whole repo.** Work only on the files named in the current task.

---

# Poker Trainer — Master Build Spec

A local-first poker training suite that takes a complete beginner to competent at
No-Limit Hold'em (NLHE) for **online play, live casino play, and home games**. Built
as a set of independent training modules under one dashboard, so each piece can be
built, tested, and shipped on its own without touching the others.

**Design principle:** every tool trains a skill that transfers to a real table — not
a toy. The order below is the order that makes you better fastest.

---

## 1. What this is (and isn't)

**Is:** a study-and-drill app you open nightly. Range drills, math drills, hand-reading
practice, a local hands-against-bots simulator, spaced-repetition concept review, and
a session/bankroll tracker for when you start playing live in Vegas.

**Is not:** a bot that plays on real poker sites. Nothing here connects to any real-money
platform, automates play, or scrapes a live table. It's a trainer. It makes *you* better;
it doesn't play for you. This keeps the whole thing clean and inside every site's ToS.

**Skill transfer:** the fundamentals (ranges, pot odds, board texture, bet sizing) are
identical online and live. The simulator builds online mechanics/speed; the live toolkit
handles the etiquette and physical mechanics that only matter in person. Same engine
serves all three contexts.

---

## 2. Tech stack & architecture

Keep it simple, local, no backend required to start.

- **Framework:** React + Vite (fast, clean, matches a static SPA).
- **Styling:** Tailwind. One shared design system across all modules.
- **Poker logic:** `pokersolver` (npm) for hand evaluation in the simulator and equity
  math. Don't hand-roll a hand evaluator — use the library, it's a solved problem.
- **State/persistence:** local only. Use `localStorage` (or `IndexedDB` if data grows)
  to persist progress, leak stats, and session logs. No auth, no server, no cloud.
- **Deploy:** runs fully local (`npm run dev`) for nightly use. Optional: push to
  Cloudflare Pages later if you want it on your phone — your existing comfort zone.
- **PWA:** add a manifest + service worker so you can "install" it and open it like an
  app. Do this last, once modules work.

**Repo shape:**

```
/src
  /modules
    /range-trainer
    /odds-trainer
    /board-reader
    /postflop-trainer
    /simulator
    /concept-deck
    /live-toolkit
  /engine        <- shared poker logic (evaluator, equity, deck, hand utils)
  /data          <- range charts, concept cards, out/equity tables (JSON)
  /store         <- progress + leak tracking (localStorage wrapper)
  /components     <- shared UI (card renderer, action buttons, stat widgets)
  /dashboard     <- home screen, progress, readiness score
```

**Why this shape:** every module is self-contained and reads from shared `/engine`,
`/data`, and `/store`. You can build one module completely, ship it, and start the next
without refactoring. Zero patchwork — each is an isolated surgical build.

---

## 3. Shared foundations (build these FIRST)

Before any trainer, build the shared layer once so every module plugs into it.

### 3a. `/engine` — poker core
- **Deck & dealing:** create/shuffle/deal utilities.
- **Card model:** rank + suit, plus a renderer component (`<Card />`) used everywhere.
- **Hand evaluator:** wrap `pokersolver` — given hole cards + board, return best 5-card
  hand and rank.
- **Equity calc:** Monte Carlo simulation (deal out N random runouts) to estimate win %
  of a hand vs a range or vs random. Used by the odds trainer and the sim.
- **Position model:** the 9-handed and 6-max seat orders (UTG → BB). One source of truth.

### 3b. `/data` — the knowledge base (accuracy matters here)
- **Range charts:** RFI (raise-first-in) opening ranges by position, for both 6-max and
  full-ring, cash and tournament. **Source these from an established chart** (e.g. a
  standard GTO/solver-based opening chart) — don't invent ranges, correctness is the
  whole point. Store as JSON: `{ format, position, hand } -> action`.
- **Outs & equity table:** standard draws → outs → approx equity (flush draw = 9 outs,
  open-ended = 8, gutshot = 4, etc.) for the odds trainer's "why."
- **Concept cards:** the spaced-repetition deck content (see 3f module).

### 3c. `/store` — progress & leak tracking
- Records per-module: attempts, accuracy %, streaks, timestamps.
- **Leak log:** tracks *which specific spots* you get wrong (e.g. "over-folds BTN vs 3-bet")
  and exposes a weighting so trainers can serve your weak spots more often.
- Simple JSON in localStorage, versioned so schema changes don't wipe progress.

---

## 4. The training modules (build in this order)

### MODULE 1 — Preflop Range Trainer  *(build first, highest ROI)*
**Purpose:** learn which hands to play from which seat. This is ~80% of what separates
someone who "knows what they're doing" from someone who doesn't. Boring, foundational,
non-negotiable.

**Core loop:** show position + a 2-card hand → user picks Raise / Call / Fold →
grade instantly vs the chart → show correct action → next hand.

**Features:**
- Session accuracy % + running lifetime accuracy (watch the curve climb).
- **Leak weighting:** spots you miss get served more often until fixed.
- **Format toggle:** 6-max vs full-ring, cash vs tournament. *Default to 6-max cash* to
  keep the first version simple; add the others as data.
- **"Why" mode:** one line of reasoning after a miss (e.g. "72o is below the button
  opening threshold").
- Configurable session length (25 / 50 / 100 hands).

**Data:** range charts from `/data`. **Build:** frontend + local state only, no engine
math needed beyond random hand dealing. Small, clean, satisfying. *This is the one you
open every night.*

---

### MODULE 2 — Pot Odds & Equity Trainer
**Purpose:** the instant table math so you're never lost on whether a call is correct.

**Core loop:** present a spot — "Pot is $X, opponent bets $Y, you hold [hand] on [board]"
→ user decides call/fold or types the equity they need → grade against the real pot odds
and hand equity.

**Features:**
- **Pot odds drill:** amount-to-call vs pot → required equity %.
- **Outs drill:** show a hand + board, user counts outs, app checks.
- **Rule of 2 & 4:** teach/quiz the shortcut (outs × 2 for one card, × 4 for two).
- **Combined verdict:** "you need 25%, you have 32% — call." Ties the two together.

**Data/engine:** outs table from `/data`; equity from `/engine` Monte Carlo. **Build:**
depends on engine equity calc being done.

---

### MODULE 3 — Board Texture & Hand Reading Trainer
**Purpose:** read the board and think in ranges, not just your own two cards.

**Core loop:** show a board → user classifies texture (dry / wet / draw-heavy /
paired / monotone) and/or picks which hand classes it favors → grade + explain.

**Features:**
- Texture classification drills.
- "What beats you" drill: given your hand + board, what possible hands have you crushed?
- Range-interaction intro: does this flop hit the preflop raiser's range or the caller's?

**Build:** mid-tier complexity; needs engine hand evaluation. Build after 1 & 2.

---

### MODULE 4 — Postflop Decision Trainer
**Purpose:** c-bet logic, facing bets, and bet sizing — where real edges live.

**Core loop:** full spot (position, preflop action, board, action to you) → choose
action + sizing → grade against solver-informed heuristics + explanation.

**Features:**
- C-bet / check decisions as the preflop aggressor.
- Facing a bet: call / raise / fold with reasoning.
- Bet-sizing sense (⅓ / ½ / ¾ / pot) tied to board texture.

**Note:** this is the hardest to grade "correctly" — real postflop is solver territory.
Keep v1 heuristic-based (solid default lines) rather than pretending to be GTO-perfect.
Build after fundamentals are solid.

---

### MODULE 5 — Local Play Simulator
**Purpose:** reps. Play full hands against bots to drill mechanics, flow, and sizing with
zero risk and no real site.

**Features:**
- Full NLHE hand engine: blinds, betting rounds, showdown, pot awarding (uses `/engine`).
- **Rule-based opponents** to start (tight/loose/aggressive archetypes via simple
  heuristics). *Do not* over-engineer bot AI in v1 — heuristic bots are plenty for
  learning mechanics and bet sizing.
- Adjustable stakes/stack depth (play-money only).
- Optional: log hands you play here into the store for the analyzer later.

**Build:** biggest single module. Do it after the drill trainers so you already know
fundamentals when you sit down to it.

---

### MODULE 6 — Spaced-Repetition Concept Deck
**Purpose:** lock in concepts long-term — board texture, 3-bet spots, position, tells,
bankroll rules — with an Anki-style adaptive review.

**Features:**
- Flashcard review with a spaced-repetition schedule (SM-2-style interval logic).
- **Adaptive:** cards you miss resurface sooner; mastered cards space out.
- Content lives in `/data/concept-cards.json` so you (or Claude) can grow the deck.

**Build:** independent of the others — can be built any time after the store exists.

---

### MODULE 7 — Live Play Toolkit  *(the Vegas bridge)*
**Purpose:** everything that only matters in person, so your first live session isn't
awkward and you look like you belong.

**Features:**
- **Session tracker:** log date, location, stakes, buy-in, cash-out, hours → auto
  win/loss and hourly rate.
- **Bankroll manager:** current roll, stakes you're rolled for (standard: 20–30+ buy-ins
  for cash), simple discipline guardrails and warnings.
- **Live etiquette/mechanics reference:** acting in turn, string bets, min-raise rules,
  chip handling, how to post/straddle, table etiquette — the stuff that trips up
  first-timers. Static reference content.
- **Vegas room notes (optional):** a place to jot which rooms/stakes you've played and liked.

**Build:** mostly UI + local storage + static content. Low complexity, high real-world
payoff for your specific goal.

---

### MODULE 8 — Hand History Analyzer  *(build LAST, only when you have real hands)*
**Purpose:** once you're actually playing online and can export hand histories, parse them
and surface your leaks.

**Features:** import/paste hand histories → parse → flag recurring mistakes (spew spots,
missed value, over-folding) → feed the leak log so the trainers target them.

**Build:** pointless until you have real hand histories to feed it. Defer until you're
playing. Listed here so it's in the architecture, not so you build it now.

---

## 5. The Dashboard
The home screen that ties it together and makes progress visible.

- Tiles for each module with your accuracy/streak on each.
- **Overall "readiness" score:** a simple composite (weighted range accuracy + odds
  accuracy + hands played in sim) that climbs as you improve — one number that answers
  "am I ready to sit at a $1/$2 table?"
- Top current leaks pulled from the leak log, with a one-tap "drill this now."
- Nightly streak counter (habit anchor for the sober-evening routine).

---

## 6. Build sequence (do NOT build all at once)

Surgical, module-by-module. Each step is a targeted Claude Code prompt, reviewed before
committing. Order:

1. **Foundations:** scaffold repo + `/engine` (deck, card renderer, evaluator wrap,
   equity calc) + `/store` + shared components.
2. **Module 1 — Range Trainer.** Ship it. Use it nightly while you build the rest.
3. **Module 2 — Odds Trainer.**
4. **Dashboard v1** (range + odds stats).
5. **Module 6 — Concept Deck** (independent, easy win).
6. **Module 3 — Board Reader.**
7. **Module 7 — Live Toolkit.**
8. **Module 4 — Postflop Trainer.**
9. **Module 5 — Simulator** (the big one).
10. **PWA wrap.**
11. **Module 8 — Analyzer** (only once you're playing real hands).

Rationale: you get a usable trainer (steps 1–2) in the first build session, then each
later session adds one clean module without disturbing what already works.

---

## 7. How to prompt Claude Code for this

Per your working style — surgical, targeted, no broad scanning:

- **One module per prompt.** Never "build the poker app." Instead: "Build the `/engine`
  deck + card model + pokersolver wrapper, nothing else."
- **Point at the exact files.** Name the module folder and the shared pieces it reads from.
- **Reference this spec** as the source of truth for what each module does.
- **Review every diff before committing.** Especially the range-chart data and the equity
  math — those are the correctness-critical parts.
- **Test each module in isolation** before moving to the next.

---

## 8. Honest scope note
This is a real, multi-week build — that's a feature, not a bug, for a nightly project. You
don't need all eight modules to get value. **Steps 1–2 alone** (foundations + range trainer)
already make you meaningfully better and give you the thing to open every evening. Everything
after that is compounding. Build the first two, use them for a week, then decide what's next.
