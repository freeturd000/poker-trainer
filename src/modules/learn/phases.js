// Learn section — the six-phase learning path (data only).
//
// This file is the single source of truth for the Learn section's STRUCTURE:
// the ordered phases, each phase's headline/description, the trainer(s) that let
// you practise it, and the section headings the article will cover. It is scaffold
// — the teaching prose is intentionally NOT written here yet. Real content gets
// dropped in later, one phase at a time, by filling each section's `body`.
//
// Shape, so later prompts know exactly where prose goes:
//   {
//     id, number, title, description,      // index-card fields (Learn home)
//     trainers: [{ view, label }],         // App nav ids to link theory → practice
//     sections: [{ heading, body }],       // article outline; body is [] for now
//   }
// A section's `body` is an array of paragraph strings. Empty array = "coming soon".
// Keeping content as plain strings (not JSX) keeps this file reviewable and lets
// the article renderer stay dumb.

export const PHASES = [
  {
    id: 'preflop-ranges',
    number: 1,
    title: 'Preflop ranges & position',
    description: 'Which hands to play from which seat — the highest-ROI fundamental.',
    trainers: [{ view: 'range', label: 'Range Trainer' }],
    sections: [
      {
        heading: 'Why preflop is 80% of the game',
        body: [
          `"Preflop" means the very first betting round — before any community cards are dealt. You are looking at just your two private cards (called your "hole cards") and deciding whether to play the hand at all. Every hand of poker starts here, which makes this the one decision you face more than any other.`,
          `Because preflop happens on every single hand, getting it right has a bigger effect on your results than any fancy move later on. If you consistently enter pots with the right hands from the right seats, you avoid the expensive trouble that beginners get into on the flop, turn, and river — where mistakes are harder to see and cost more.`,
          `That is why preflop discipline is the highest-return thing a new player can learn. It is not flashy, but it is the foundation everything else sits on. Master this phase and you will already play better than most people you sit down against.`,
        ],
      },
      {
        heading: 'Position: who acts last, and why it wins',
        body: [
          `"Position" refers to where you are sitting relative to the dealer button, and — more importantly — when it is your turn to act. In poker, players act one at a time, going clockwise. The key insight is simple: acting later is better than acting earlier.`,
          `Why? Information. When you act after your opponents, you have already seen what they did — whether they bet, checked, or folded — before you have to commit any chips. When you act first, you are guessing in the dark. More information means better decisions, every single time.`,
          `Two terms you will hear constantly: being "in position" (often written "IP") means you act after your opponent on each betting round. Being "out of position" ("OOP") means you have to act first. In position is a genuine, lasting advantage — it does not go away — which is why we work so hard to play more hands from the seats that get to act last.`,
        ],
      },
      {
        heading: 'The six seats in 6-max',
        body: [
          `This app focuses on "6-max" — a six-handed cash game, the most common online format. The six seats, in the order they act before the flop, are: UTG, HJ (the hijack), CO (the cutoff), BTN (the button), SB (the small blind), and BB (the big blind).`,
          `A few of those need defining. The "button" (BTN) marks the nominal dealer and is the best seat at the table, because it acts last on every betting round after the flop. The "small blind" (SB) and "big blind" (BB) are the two seats to the button's left; they are forced to put chips in before any cards are dealt (the "blinds"), which is what gives everyone something to compete for. "UTG" stands for "under the gun" — the first player to act and therefore the earliest, most disadvantaged seat.`,
          `The guiding principle for all of preflop is tight-early, wide-late. Early seats (UTG, HJ) have many players still to act behind them, so any hand you play is more likely to run into a strong hand — you stay tight and play only premium holdings. Late seats (CO, BTN) have few or no players left to act, so you can profitably play a much wider range of hands. The button is the widest of all.`,
        ],
      },
      {
        heading: 'RFI: what "raise first in" means',
        body: [
          `"RFI" stands for "raise first in." It describes the situation where everyone before you has folded, and you are the first player to voluntarily enter the pot. The standard, disciplined play in that spot is to come in for a raise — not to just call the big blind (which is called "limping").`,
          `Why raise instead of limp? Raising does three good things at once: it can win the blinds immediately if everyone folds, it takes the lead in the hand (initiative), and it thins the field so you face fewer opponents. Limping does none of these and mostly invites trouble. In modern winning poker, when you are first in, the choice is raise or fold.`,
          `The set of hands you would open-raise is called your "range." Your RFI range is not fixed — it depends entirely on your seat. From UTG you raise a tight range of strong hands; from the button you raise a wide range, because position and the empty seats behind you make far more hands profitable. Learning the right range for each seat is the core skill of this whole phase.`,
        ],
      },
      {
        heading: 'Reading a range chart (the 13×13 grid)',
        body: [
          `Ranges are almost always written down as a 13-by-13 grid — 169 squares that cover every possible two-card starting hand in one compact map. You will meet this grid everywhere ranges are published (charts, books, solver tools), so learning to read it at a glance turns the whole question of "which hands do I play" into something visual and fast.`,
          `Here is the layout. The diagonal running from the top-left corner to the bottom-right is every "pocket pair" (two cards of the same rank, like two kings, written "KK"). The triangle above the diagonal is the "suited" hands — two cards of the same suit, written with a lower-case "s", like "AKs" (ace-king suited). The triangle below the diagonal is the "offsuit" hands — different suits, written with an "o", like "AKo" (ace-king offsuit). Suited hands are stronger than their offsuit versions because they can make flushes.`,
          `On an RFI chart, each square is simply in the range or not: a highlighted square means "raise this hand," and a blank square means "fold it." That is what "raise or fold" means here — when it is folded to you, those are your only two choices, and the chart tells you which is which. To read it, find your hand's square (pairs on the diagonal, suited up-and-right, offsuit down-and-left) and check whether it is in the raising range.`,
          `The Range Trainer does not make you stare at the whole grid — it drills you on it one square at a time. It deals you a single hand from a given seat and asks for your decision, which is really just asking, "is this square in the range or not?" Do that a few hundred times and the grid ends up memorised without your ever having to look at it.`,
        ],
      },
      {
        heading: 'Open-raising by seat: tight early, wide late',
        body: [
          `Putting it together: as you move from UTG toward the button, your opening range gets wider. Rough guides for 6-max cash — the exact numbers depend on the chart you are using, so treat these as ballpark — look something like this.`,
          `From UTG you open the tightest range, only your strongest hands: big pairs, strong broadway hands like AK and AQ, and a few suited connectors. The hijack (HJ) adds a bit more, and the cutoff (CO) more still — more middle pairs, more suited aces, weaker broadways. By the time you reach the button (BTN) you are opening a very wide range, because you will have position on everyone for the rest of the hand and can play almost any two reasonable cards.`,
          `The small blind (SB) is a special case. It is also a "raise or fold" spot when folded to you, and you open a fairly wide range — but remember you will be out of position for the rest of the hand, so it is not as comfortable as the button despite the wide range. The big blind is different again, and gets its own decision below.`,
        ],
      },
      {
        heading: 'Defending the big blind',
        body: [
          `RFI is one of the two preflop decisions you will drill. The other is "big blind defense" — what to do when you are sitting in the big blind and someone raises before it gets to you.`,
          `The key fact is that you defend the big blind much wider than you would open-raise from any seat — meaning you continue with many more hands, either by calling or by re-raising (a "3-bet"). Two reasons. First, you are getting a discount: you already have one big blind invested (the forced bet you posted), so it costs you less to call than it costs anyone else, which improves your "pot odds" — the price you are getting on the call. Second, if you just call a single raise, you "close the action" — you are the last player to act preflop, so no one can raise you again this round. Both of those make continuing cheaper and safer than it looks.`,
          `One caution keeps this honest: defending wide does not mean defending with anything. You will be out of position for the rest of the hand, so the weakest, most awkward hands are still folds. The chart in the Range Trainer's big-blind defense mode shows exactly which hands to call, which to 3-bet, and which to let go against a raise from each seat.`,
        ],
      },
      {
        heading: 'Common preflop leaks (beginner mistakes)',
        body: [
          `A "leak" is a recurring mistake that quietly drains your chips. These are the preflop leaks almost every beginner has — spotting them in your own play is half the battle.`,
          `Playing too many hands. This is the single biggest leak. It feels boring to fold, so new players enter pots with hands that are simply not profitable, especially from early seats. Discipline beats action. Playing too many weak aces. A hand like ace-seven offsuit looks nice because of the ace, but from early and middle positions it is a trap — when you make a pair of aces you are often out-kicked by a better ace and lose a big pot.`,
          `Calling too much (and limping). Beginners love to call — to "see a flop" cheaply. But calling is passive; it gives up the initiative and lets weak hands drag you into trouble. When first in, raise or fold rather than limp. Ignoring position. Playing the same hands from every seat is a classic error. The same two cards can be an easy raise on the button and an easy fold under the gun — where you are sitting changes the answer, and the chart reflects that.`,
        ],
      },
      {
        heading: 'How to practice this',
        body: [
          `Reading about ranges is not the same as knowing them cold. That is what the Range Trainer is for. It shows you a seat and a hand and asks for your decision, grades it instantly against the correct chart, and — using leak weighting — serves the spots you get wrong more often until they stick.`,
          `Drill both modes. Start with RFI (raise first in) to lock in your opening ranges seat by seat, then work on big-blind defense to handle the other side of the preflop decision. A short session every night will move your accuracy up the curve fast. Tap "Range Trainer" above to begin.`,
        ],
      },
    ],
  },
  {
    id: 'pot-odds-equity',
    number: 2,
    title: 'Pot odds, outs & equity',
    description: 'The table math — is this call profitable? Learn to answer instantly.',
    trainers: [{ view: 'odds', label: 'Odds Trainer' }],
    sections: [
      {
        heading: 'What "equity" means',
        body: [
          `First, one word for the thing everyone is fighting over: the "pot" is all the chips that have been bet on a hand, sitting in the middle. Whoever wins the hand takes the pot. Every decision in this phase is really the same question — is it worth putting more chips in to try to win that pot?`,
          `"Equity" is your share of the pot right now, written as a percentage: your chance to win the hand if all the remaining cards were dealt out. If you would win 3 times out of every 10 in a given spot, your equity is 30%. That is it — equity is just "how often do I win from here."`,
          `Equity is the "what I have" number. The whole skill in this phase is estimating your equity quickly and comparing it to the price you are being asked to pay to keep playing. Get good at that comparison and you will never again be lost on whether a call is a good one.`,
        ],
      },
      {
        heading: 'Counting your outs',
        body: [
          `When your hand is not yet good but could become the best hand with one more card, you have a "draw." An "out" is a specific card still to come that turns your hand into the likely winner. Counting your outs is how you turn a draw into an equity estimate.`,
          `To count outs, work out exactly which cards make your hand, then count how many of them are still unseen (you can see your two cards and the board; everything else is unknown). Three draws come up constantly, and their out counts are worth memorising:`,
          `Flush draw = 9 outs. A "flush" is five cards of the same suit; a flush draw is when you have four of them and need a fifth. Example: you hold 9♥ 6♥ and the board is K♥ 4♥ 2♠. You can see four hearts, and a deck has thirteen of each suit, so 13 − 4 = 9 hearts are left to complete your flush.`,
          `Open-ended straight draw = 8 outs. A "straight" is five cards in a row (like 5-6-7-8-9). "Open-ended" means you have four in a row and can complete it at either end. Example: you hold 6 5 and the board has 7 8 — now any 4 or any 9 makes your straight. There are four 4s and four 9s in the deck, so 4 + 4 = 8 outs.`,
          `Gutshot (inside straight draw) = 4 outs. This is a straight draw missing a card in the middle, so only one rank completes it. Example: you hold 9 8 with 6 5 on the board — only a 7 fills 9-8-7-6-5. There are four 7s, so 4 outs.`,
          `A few more the trainer will show you: two "overcards" (two cards both higher than anything on the board) is 6 outs, a pocket pair hoping to make three-of-a-kind (a "set") is 2 outs, and big combination draws — a flush draw plus an open-ended draw — can be 15. One catch when you combine draws: do not double-count a card that helps both, which is why a flush-plus-straight draw is 15 outs, not 17.`,
        ],
      },
      {
        heading: 'The Rule of 2 and 4',
        body: [
          `Once you have an out count, the "Rule of 2 and 4" turns it into an equity estimate in one step of mental math — no fractions, no calculator.`,
          `If there is one card still to come (you are on the turn, waiting on the river), multiply your outs by 2. If there are two cards still to come (you are on the flop, with the turn and river to come), multiply your outs by 4. The result is roughly your percentage chance to hit.`,
          `Worked examples. A flush draw (9 outs) on the flop: 9 × 4 = 36% (the true figure is about 35% — close enough). That same flush draw on the turn, one card to come: 9 × 2 = 18%. An open-ended straight draw (8 outs) on the flop: 8 × 4 = 32%. A gutshot (4 outs) on the turn: 4 × 2 = 8%.`,
          `Remember it is an estimate, not an exact figure. The ×4 version runs a little high for very large draws (15 outs × 4 = 60%, where the true number is closer to 54%), but it is more than accurate enough to make the right decision at the table.`,
        ],
      },
      {
        heading: 'Pot odds: the price of a call',
        body: [
          `Equity is "what you have." "Pot odds" are "what you need" — the price you are being offered to call. When an opponent bets and the action is on you, the pot already holds their bet; you have to decide whether the amount you must call is worth the size of the pot you would win.`,
          `The break-even rule is simple: you call some amount to win what is already in the pot, and your required equity is that call divided by the total. Put plainly — you call $X to win the $Y that is now in the pot, so you need to win at least X ÷ (X + Y) of the time. That fraction is the minimum equity that makes calling worthwhile.`,
          `You do not have to run that division every time, because a few bet sizes cover most spots. Measuring the bet against the pot before the bet: if your opponent bets about a third of the pot, you need roughly 20% equity to call; if they bet half the pot, you need about 25%; if they bet the full pot, you need about 33%.`,
          `Where do those come from? The bigger the bet relative to the pot, the worse the price, so the more equity you need. Take the full-pot case: say $50 is in the pot and your opponent bets $50. Now the pot holds $100 and it costs you $50 to call — you are risking $50 to win that $100, which works out to 50 ÷ (50 + 100), about 33%. The half-pot and third-pot numbers come out the same way. (A three-quarter-pot bet lands around 30%, and a bet bigger than the pot needs more still.)`,
        ],
      },
      {
        heading: 'Putting it together: the call/fold verdict',
        body: [
          `Now combine the two numbers. Estimate what you HAVE (your equity, from your outs via the Rule of 2 and 4) and what you NEED (your pot odds, from the bet size). Then compare: if you have more than you need, call; if you have less, fold. That single comparison is the heart of every drawing decision in poker.`,
          `A full example, start to finish. You hold two hearts and the flop brings two more hearts — a flush draw, 9 outs. Two cards are still to come, so 9 × 4 = 36% equity: that is what you have. Your opponent bets half the pot, so you need about 25%: that is what you need. 36% is more than 25%, so you call.`,
          `Now flip it. You have a gutshot (4 outs) on the turn, one card to come, so 4 × 2 = 8% equity. Your opponent bets the full pot, so you need about 33%. 8% is far less than 33% — an easy fold. This is exactly the verdict the Odds Trainer states for you: "You need 33%, you have 8% — fold."`,
        ],
      },
      {
        heading: 'What you do NOT need to do',
        body: [
          `If the math has you worried, relax — you never compute exact percentages at a real table. There is no calculator, no long division, no memorising equity charts.`,
          `What you actually do takes a couple of seconds: glance at the board and count your outs, multiply by 2 or 4, eyeball the bet against the pot to get the price you need, and compare the two. Estimate, then compare — that is the entire process.`,
          `And close is good enough. Most of the time the gap between what you have and what you need is wide enough that rough numbers point to the same answer as perfect ones. The math only gets tight in a few borderline spots, and even there, estimate-and-compare will not steer you far wrong.`,
        ],
      },
      {
        heading: 'How to practice this',
        body: [
          `The Odds Trainer drills these skills one at a time, so each becomes automatic. It has four modes that map exactly onto this phase: Pot Odds (given a bet, state the equity you need), Outs (given a hand and board, count them), Rule of 2 & 4 (turn an out count into an equity estimate), and Combined Verdict (a full spot — call or fold).`,
          `Start with Outs and the Rule of 2 & 4 until counting and multiplying feel effortless, then move to Pot Odds, and finish on the Combined Verdict, which ties it all together. A handful of each every night and the table math stops being something you calculate and starts being something you just see. Tap "Odds Trainer" above to begin.`,
        ],
      },
    ],
  },
  {
    id: 'board-texture',
    number: 3,
    title: 'Board texture & hand reading',
    description: 'Read the board and think in ranges, not just your own two cards.',
    trainers: [{ view: 'board', label: 'Board Reader' }],
    sections: [
      { heading: 'Dry, wet, and draw-heavy boards', body: [] },
      { heading: 'Paired and monotone textures', body: [] },
      { heading: 'What beats you: reading the nuts', body: [] },
      { heading: 'Whose range does this flop favor?', body: [] },
      { heading: 'How texture drives your decision', body: [] },
    ],
  },
  {
    id: 'postflop-decisions',
    number: 4,
    title: 'Postflop decisions & bet sizing',
    description: 'C-bets, facing bets, and sizing — where the real edges live.',
    trainers: [{ view: 'postflop', label: 'Postflop Trainer' }],
    sections: [
      { heading: 'The c-bet: when to fire as the aggressor', body: [] },
      { heading: 'Checking back and pot control', body: [] },
      { heading: 'Facing a bet: call, raise, or fold', body: [] },
      { heading: 'Bet sizing tied to texture (⅓ / ½ / ¾ / pot)', body: [] },
      { heading: 'Value bets vs bluffs', body: [] },
      { heading: 'Why this is heuristic, not solved', body: [] },
    ],
  },
  {
    id: 'volume-reps',
    number: 5,
    title: 'Volume & reps',
    description: 'How to practice so it sticks — turning study into instinct.',
    trainers: [
      { view: 'simulator', label: 'Simulator' },
      { view: 'concept', label: 'Concept Deck' },
    ],
    sections: [
      { heading: 'Why reps beat reading', body: [] },
      { heading: 'Using the Simulator to drill mechanics', body: [] },
      { heading: 'Spaced repetition and the Concept Deck', body: [] },
      { heading: 'Reviewing your leaks', body: [] },
      { heading: 'Building a nightly study routine', body: [] },
    ],
  },
  {
    id: 'live-vegas',
    number: 6,
    title: 'Live play & Vegas prep',
    description: 'Etiquette, mechanics, and bankroll — so your first live session feels natural.',
    trainers: [{ view: 'live', label: 'Live Toolkit' }],
    sections: [
      { heading: 'How a live table actually runs', body: [] },
      { heading: 'Etiquette: acting in turn, string bets, min-raises', body: [] },
      { heading: 'Chip handling, posting & straddling', body: [] },
      { heading: 'Bankroll management for live cash', body: [] },
      { heading: 'Tracking sessions and win rate', body: [] },
      { heading: 'Your first Vegas trip: a checklist', body: [] },
    ],
  },
]

// Lookup helper for the article router.
export function getPhase(id) {
  return PHASES.find((p) => p.id === id) ?? null
}
