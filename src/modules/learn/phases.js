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
          `One thing to have at your fingertips before any of this: the ranking of hands, best to worst. Whichever five cards make the strongest hand wins the pot. Here is the full ladder for reference — you will use it every hand.`,
        ],
        visual: 'HandRankings',
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
        visual: 'PositionDiagram',
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
          `Here is the live chart to explore. Switch between seats and watch the raising range widen from UTG to the button, or tap any hand to see which seats open it — this is the exact chart the Range Trainer grades you against.`,
        ],
        visual: 'RangeGridVisual',
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
          `See it concretely below — a real hand and board for each draw, with the exact cards that are your outs laid out and counted. Tap through the examples until "count the outs" feels like just looking.`,
        ],
        visual: 'OutsVisual',
      },
      {
        heading: 'The Rule of 2 and 4',
        body: [
          `Once you have an out count, the "Rule of 2 and 4" turns it into an equity estimate in one step of mental math — no fractions, no calculator.`,
          `If there is one card still to come (you are on the turn, waiting on the river), multiply your outs by 2. If there are two cards still to come (you are on the flop, with the turn and river to come), multiply your outs by 4. The result is roughly your percentage chance to hit.`,
          `Worked examples. A flush draw (9 outs) on the flop: 9 × 4 = 36% (the true figure is about 35% — close enough). That same flush draw on the turn, one card to come: 9 × 2 = 18%. An open-ended straight draw (8 outs) on the flop: 8 × 4 = 32%. A gutshot (4 outs) on the turn: 4 × 2 = 8%.`,
          `Remember it is an estimate, not an exact figure. The ×4 version runs a little high for very large draws (15 outs × 4 = 60%, where the true number is closer to 54%), but it is more than accurate enough to make the right decision at the table.`,
          `Try it yourself below. Set the number of outs, flip between one and two cards to come, and watch the estimate — outs × 2 or × 4 — update instantly. The common-draw presets jump you to the counts worth memorising.`,
        ],
        visual: 'RuleOf24Demo',
      },
      {
        heading: 'Pot odds: the price of a call',
        body: [
          `Equity is "what you have." "Pot odds" are "what you need" — the price you are being offered to call. When an opponent bets and the action is on you, the pot already holds their bet; you have to decide whether the amount you must call is worth the size of the pot you would win.`,
          `The break-even rule is simple: you call some amount to win what is already in the pot, and your required equity is that call divided by the total. Put plainly — you call $X to win the $Y that is now in the pot, so you need to win at least X ÷ (X + Y) of the time. That fraction is the minimum equity that makes calling worthwhile.`,
          `You do not have to run that division every time, because a few bet sizes cover most spots. Measuring the bet against the pot before the bet: if your opponent bets about a third of the pot, you need roughly 20% equity to call; if they bet half the pot, you need about 25%; if they bet the full pot, you need about 33%.`,
          `Where do those come from? The bigger the bet relative to the pot, the worse the price, so the more equity you need. Take the full-pot case: say $50 is in the pot and your opponent bets $50. Now the pot holds $100 and it costs you $50 to call — you are risking $50 to win that $100, which works out to 50 ÷ (50 + 100), about 33%. The half-pot and third-pot numbers come out the same way. (A three-quarter-pot bet lands around 30%, and a bet bigger than the pot needs more still.)`,
          `Play with it below. Change the pot and the bet — or tap a quick bet size — and watch the equity you need move; when the bet matches a common fraction, its shortcut lights up. This is the exact calculation the Odds Trainer grades you on.`,
        ],
        visual: 'PotOddsCalc',
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
      {
        heading: 'What "board texture" means',
        body: [
          `In Hold'em, some cards are dealt face-up in the middle of the table for everyone to share — these are the "community cards," or simply "the board." They come in stages: the "flop" (the first three), the "turn" (a fourth), and the "river" (a fifth). You combine them with your own two cards to make your hand.`,
          `"Board texture" is the personality of those community cards — how they fit together and what kinds of hands they make likely. Two flops with the same high card can be worlds apart: one is quiet and safe, the other is a minefield of possible straights and flushes. Reading that difference is the skill this phase builds.`,
          `Why it matters: the same pair of aces in your hand is a monster on one board and a trap on another. Good players barely look at their own two cards until they have read the board, because the board decides which hands are even possible — for you and for your opponent.`,
        ],
      },
      {
        heading: 'The five textures: dry, wet, paired, monotone, two-tone',
        body: [
          `Textures come from three separate questions about the board, so a single flop can wear more than one label at once. The first and most important question is how connected the cards are — the dry/wet axis.`,
          `A "dry" board is disconnected: the cards do not work together, so very few strong hands or draws are possible. Example: K♠ 7♦ 2♣ — three different ranks far apart, three different suits. Nothing here makes a straight or a flush. On a dry board a single strong pair is usually safe, and it is hard for anyone to have hit a big hand. The danger is low.`,
          `A "wet" board is connected and full of possibilities. A "draw" is an unfinished hand waiting on one more card — like four cards toward a straight or a flush — and wet boards are covered in them. Example: 9♥ 8♠ 7♦ — even with three different suits, so many straights are already there or one card away that the board is dangerous. On a wet board your single pair is fragile, because so many hands beat it or are drawing to beat it. (The more draws, the "wetter" — a very wet board is sometimes called draw-heavy.)`,
          `The other two questions are about suits and pairs, and each adds its own label on top of dry or wet. "Monotone" means all three flop cards are the same suit, like A♥ 9♥ 4♥ — a flush (five cards of one suit) is already possible, so anyone holding two hearts already has one and even a single heart is a strong draw. A monotone flop always counts as wet. "Two-tone" means exactly two suits are present — two cards share a suit, like Q♥ 7♥ 2♣ — so a flush draw is live but not yet complete. Two-tone alone does not make a board wet; it just adds flush danger on top of whatever the connectedness says. (A board with three different suits is called "rainbow" — no flush is coming, so it carries no suit label at all.)`,
          `"Paired" means two of the board cards share a rank, like K♠ K♦ 7♣. Now someone holding the third card of that rank has three of a kind ("trips"), and full houses become possible — so even a strong two pair is worth less. Paired boards tend to be dry in other respects, because a repeated rank leaves fewer distinct cards to build straights from.`,
          `Put together, a board can be several of these at once. 9♠ 8♠ 7♦ is both wet (connected) and two-tone (a flush draw) — about as dangerous a flop as there is. Learning to spot every label a board carries is exactly what the Texture drill trains.`,
        ],
      },
      {
        heading: 'Thinking in ranges, not hands',
        body: [
          `Here is the mental shift that separates beginners from real players. A beginner asks, "what do I have?" A stronger player asks, "what could my opponent have?" — and answers it with a range.`,
          `A "range" is the full set of hands someone could be holding in a given spot, not one specific guess. You almost never know an opponent's exact two cards, and trying to guess them is a fool's errand. But you can narrow the possibilities: their seat, whether they raised or called before the flop, and how they have bet all point to a group of likely hands. That group is their range.`,
          `You read ranges because it is both more honest and more useful than guessing a single hand. Instead of "I bet he has ace-king," you think "his range here is big pairs, strong aces, and a few draws — how does this board hit that range, and how does it hit mine?" Every idea in the rest of this phase — what beats you, who the board favors — is really an exercise in comparing your range to theirs.`,
        ],
      },
      {
        heading: 'What beats you: seeing the danger',
        body: [
          `Once you can read a board, you can ask the concrete question that keeps you out of trouble: given my hand and this board, what stronger hands are actually possible?`,
          `The trick is to look only at the board and imagine what an opponent's two cards could add to it. Say you hold two pair on a board of 9♠ 8♠ 7♦ 2♣. Anyone holding a ten and a six already has a straight (T-9-8-7-6), and combos like jack-ten or six-five make one too — so several very real hands already beat you. On top of that, two of the board cards are spades, so an opponent with two spades holds a flush draw that could beat you on the river. Your two pair looked great a moment ago; now it is in real danger — and that is information you need before you put more chips in.`,
          `This is not about being paranoid; it is about being accurate. Sometimes the answer is "almost nothing beats me — this board is dry and my hand is huge." Other times it is "a lot beats me here." Either way, naming the hands that beat you turns a vague nervous feeling into a clear read. The What Beats You drill is exact combinatorial truth — it checks every possible opponent holding — so it is a perfect way to train this instinct.`,
        ],
      },
      {
        heading: 'Whose range does the board favor?',
        body: [
          `Boards do not hit both players equally. Consider the most common spot: someone raised before the flop while in position (acting last), and the big blind called. The "preflop raiser" chose to come in for a raise, so their range is strong at the top — big cards like ace-king and ace-queen, and big pairs. The caller's range is wider and more capped: suited connectors, small pairs, and other speculative hands that were cheap to call with.`,
          `That difference means some flops favor one player's range over the other. High, broadway, disconnected flops favor the raiser — a board like A-K-4 or K-Q-7 slots right into their big cards and big pairs, hands the caller rarely has. Low, connected flops favor the caller — a board like 7-6-5 or 9-8-7 smashes into suited connectors and small pairs, making straights, sets, and two pair the raiser almost never holds. Boards in between favor neither much; call those neutral.`,
          `Treat this as a helpful rule of thumb, not a law — it is a heuristic tuned for that specific raiser-versus-caller situation, and real spots have shades of grey. But the core idea is rock-solid and worth internalizing: before you decide who should be betting, ask whose range the board actually helps. The Range Interaction drill quizzes you on exactly these clear-cut boards.`,
        ],
      },
      {
        heading: 'Common beginner mistakes',
        body: [
          `Only looking at your own two cards. The most common error of all is falling in love with your hand and never asking what the board makes possible for everyone else. Your hand's value is set by the board, not by how pretty your cards looked preflop.`,
          `Not noticing a scary board. Beginners miss that the board now has three to a flush, or four to a straight, and keep betting a hand that is no longer good. Train yourself to re-read the board every time a card is added.`,
          `Overvaluing one pair on a wet board. Top pair is a fine hand on a dry board and a liability on a soaked one. The same holding is not worth the same on 9♥ 8♠ 7♦ as it is on K♠ 7♦ 2♣ — and playing it the same way on both is how stacks get lost.`,
          `Ignoring the opponent's range. Assuming your opponent "probably has nothing" (or, just as bad, "probably has the nuts") instead of thinking through the actual group of hands they can hold. Read their range, then read how the board hits it.`,
        ],
      },
      {
        heading: 'How to practice this',
        body: [
          `The Board Reader trainer drills the three skills from this phase directly. Texture ID shows you a flop and asks you to tag it — dry or wet, plus paired, monotone, or two-tone where they apply. What Beats You gives you a hand and a full board and asks which kinds of hands could beat you. Range Interaction shows a raiser-versus-caller flop and asks whose range it favors.`,
          `Run a mix of all three every night. Texture ID builds the fast read, What Beats You keeps you honest about danger, and Range Interaction trains the higher-level "who does this board help" question — together they turn board reading from something you puzzle over into something you see at a glance. Tap "Board Reader" above to start.`,
        ],
      },
    ],
  },
  {
    id: 'postflop-decisions',
    number: 4,
    title: 'Postflop decisions & bet sizing',
    description: 'C-bets, facing bets, and sizing — where the real edges live.',
    trainers: [{ view: 'postflop', label: 'Postflop Trainer' }],
    sections: [
      {
        heading: 'What "postflop" means',
        body: [
          `"Postflop" simply means everything that happens after the flop is dealt — the flop, turn, and river betting rounds, once there are community cards on the table. "Preflop" (Phase 1) was about which hands to play; postflop is about how to play them once real cards are out.`,
          `This is where the biggest money decisions live. Preflop pots are small — usually just the blinds and a raise. Postflop, the pot grows with every bet, so the choices you make here — whether to bet, call, raise, or fold, and for how much — are worth far more than any single preflop decision. Good postflop play is the difference between a small winner and a big one.`,
          `One honest caveat up front: perfect postflop poker is genuinely hard — it is the domain of solvers (computer programs that calculate near-optimal play). This phase does not try to make you perfect. It teaches solid default lines — reliable rules of thumb that are right most of the time and keep you out of big trouble. Think of them as strong training wheels, not the final word. The Postflop Trainer is labelled the same way: "heuristic default lines, not GTO-perfect."`,
        ],
      },
      {
        heading: 'Sorting your hand: value, draw, marginal, air',
        body: [
          `Before any postflop decision, sort your hand into one of four buckets. Almost every default line falls out of which bucket you are in, so this is the foundation for the rest of the phase.`,
          `Value — a made hand strong enough to bet and raise for profit: two pair or better, or "top pair" (one of your cards pairs the highest card on the board) or an "overpair" (a pocket pair higher than every board card, like two queens on a 9-7-2 board). Value hands want to build the pot.`,
          `Draw — you do not have much of a made hand yet, but you have a strong draw: a "flush draw" (four cards toward a flush, needing one more) or an "open-ended straight draw" (four in a row that completes at either end, eight cards to hit). Draws have lots of equity — chances to improve — so you play them aggressively or continue with them. Note a bare "gutshot" (an inside straight draw needing one specific rank) is NOT strong enough to count here.`,
          `Marginal — a weak made pair: middle pair, bottom pair, or a small pocket pair below the top board card. It has some "showdown value" (it can win if you simply get to the end and show it down) but it is fragile, so you keep the pot small with it. Air — no pair and no strong draw (a bare gutshot lands here too). It has no value now; if you bet, you are bluffing.`,
          `One rule about overlap: the strongest action wins. A weak pair that also has a flush draw is treated as a draw, not a marginal hand, because its equity — not its showdown value — is what should drive the decision.`,
        ],
      },
      {
        heading: 'The c-bet: betting as the preflop aggressor',
        body: [
          `If you were the last player to raise before the flop, you are the "preflop aggressor," and a bet on the flop is called a "continuation bet," or "c-bet" — you are continuing the aggression you showed preflop. Deciding when to c-bet is the first big postflop skill, and it follows straight from your bucket and the board.`,
          `With a value hand, always c-bet — you want to build the pot and charge worse hands and draws to keep playing. With a strong draw, c-bet as a "semi-bluff": you can win the pot right now if they fold, and if they do not, you still might improve to the best hand. Both of these are betting for good reasons.`,
          `With air, only c-bet as a bluff on boards that favor your range — dry boards that do not favor the caller. This ties directly back to board texture (Phase 3): high, dry, disconnected flops hit the raiser's big cards and big pairs, so a bluff there tells a believable story and folds out their weak hands. On a wet or caller-favoring board (low, connected), bluffing into the range that just connected only burns chips — so check and give up. With a marginal hand, split by texture too: on a dry board a small c-bet takes it down often and denies equity to overcards; on a wet board, check for "pot control" — keeping the pot small rather than bloating it with a hand that cannot stand pressure.`,
          `The whole rule collapses to one sentence: bet more on dry boards that favor your range, and check more on wet boards that favor the caller.`,
        ],
      },
      {
        heading: 'Facing a bet: fold, call, or raise',
        body: [
          `Now flip roles: someone bets into you and you must choose fold, call, or raise. Combine three things — how strong your hand is (your bucket), the board texture, and your "pot odds" (the price the bet is laying you, from Phase 2's math).`,
          `With a big value hand — two pair or better — raise for value; you rate to be well ahead, so build the pot. With a one-pair value hand (top pair or an overpair), just call. Raising here mostly folds out the worse hands you beat and bloats the pot against the better hands that would continue, so calling keeps things controlled.`,
          `With a draw, do the Phase 2 math: estimate your equity with the Rule of 2 and 4 (outs × 4 on the flop, × 2 on the turn) and compare it to the equity the bet requires. Priced in — your equity meets the price — call; if not, fold. For example, a flush draw (about 9 outs, ~36% on the flop) against a half-pot bet (which needs about 25%) is an easy call.`,
          `With a marginal hand, only "bluff-catch" small bets — call a small bet because at a cheap price you beat enough of their bluffs to make it worth it, but fold to a large one. Be tighter on wet boards (call only very small bets there) than on dry ones, because wet boards give opponents more strong hands to be betting. With air, fold — there is nothing to continue with.`,
        ],
      },
      {
        heading: 'Bet sizing: ⅓, ½, ¾, or pot',
        body: [
          `Once you have decided to bet, how much? Sizes are measured as a fraction of the pot: about a third, a half, three-quarters, or a full pot-sized bet. The default rule is to size by how "dynamic" the board is — how many draws are out and how likely the best hand is to change by the river.`,
          `Bet small on dry, static boards and big on wet, dynamic ones. Concretely: a dry board like K♠ 7♦ 2♣ takes about a third-pot bet (a "range bet" — few draws to charge, and a small size keeps their weak hands in). A semi-connected board like K-Q-7 takes about half pot. A wet board like 9-8-7 takes about three-quarters. And a very wet board — three to a flush, or a connected two-tone like 9♠ 8♠ 7♦ — takes a full pot-sized bet to charge the many draws and build the pot before a scary card lands.`,
          `A word on value bets versus bluffs: the beginner instinct is to bet big with strong hands and small with weak ones, but that is a leak — observant opponents read you instantly. The default here is the opposite discipline: let the board texture pick your size, and use the same size whether you are betting for value or bluffing. Matching your sizes is what keeps you balanced and hard to exploit. (Advanced players sometimes vary sizes deliberately, but texture-based, matched sizing is the solid default to start from.)`,
        ],
      },
      {
        heading: 'Common beginner mistakes',
        body: [
          `C-betting every board. Firing the flop every single time just because you raised preflop is the classic leak. On wet, caller-favoring boards your bluffs get called and raised — those are the boards to check.`,
          `Never folding a made hand. Falling in love with top pair or an overpair and refusing to let it go when the betting screams you are beaten. A pair is not the nuts; when a marginal or one-pair hand faces heavy pressure, folding is often the whole skill.`,
          `Calling too wide out of position. "Out of position" means you have to act first on every street (Phase 1). Defending too many hands there means guessing all the way down and leaking chips — you need a stronger hand to continue when you will be acting first.`,
          `Raising your one-pair hands for value. Blasting a raise with top pair usually folds out everything you beat and only gets called by better. Most one-pair hands prefer to call and keep the pot small, not raise.`,
        ],
      },
      {
        heading: 'How to practice this',
        body: [
          `The Postflop Trainer drills the three decisions from this phase directly: C-bet Decision (bet or check as the preflop aggressor), Facing a Bet (fold, call, or raise when bet into), and Bet Sizing (pick ⅓, ½, ¾, or pot). Each grades your answer against the default lines above and explains why, so the reasoning sinks in.`,
          `Keep the framing honest as you drill: the trainer grades "heuristic default lines, not GTO-perfect" play. Real postflop is solver territory, and these rules are strong defaults, not laws — their job is to give you sound instincts and keep you out of big mistakes, which is exactly what a beginner needs. Learn them cold first; refine later. Tap "Postflop Trainer" above to begin.`,
        ],
      },
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
      {
        heading: 'Why reps beat reading',
        body: [
          `You have now read the fundamentals — ranges, pot odds, board texture, postflop lines. Here is the uncomfortable truth: reading them is not the same as knowing them. Poker skill lives in your reflexes, and reflexes are built by repetition, not by understanding something once.`,
          `At a real table you do not have time to reason it all out from scratch. The pot is there, it is your turn, and you have seconds to act. What you want is for the right answer to just appear — "that is a fold," "that is a call," "I need about 25% here." That instant recall only comes from doing the same decisions many, many times until they are automatic.`,
          `So this phase is not a new skill to learn. It is about the process of turning everything you have read into instinct through volume — lots of repetitions, done regularly. Knowledge that stays in your head does not win pots; knowledge drilled into your hands does.`,
        ],
      },
      {
        heading: 'How to use this app to improve',
        body: [
          `Each part of this app trains a different piece, and they are meant to be used together. Here is what to lean on and roughly in what order.`,
          `Start with the Range Trainer, every session. Preflop is the foundation — the decision you face most and the one that prevents the most mistakes — so drilling your opening ranges and big-blind defense is the single highest-value habit. Then rotate through the Odds Trainer (the table math), the Board Reader (reading textures and ranges), and the Postflop Trainer (default lines for betting and facing bets) to round out the skills.`,
          `When you want to put it all together, open the Simulator and play full hands against the bots — it is where isolated skills become real decisions in sequence. Use the Concept Deck to lock ideas into long-term memory (more on it below), and check the Dashboard to see your accuracy climb, find your weak spots, and keep your streak alive.`,
        ],
      },
      {
        heading: 'Deliberate practice: work your leaks',
        body: [
          `There is a difference between practice and deliberate practice. Practice is doing reps. Deliberate practice is aiming those reps at the exact things you are worst at — and it improves you far faster.`,
          `A "leak" is a specific spot you keep getting wrong — say, over-folding the big blind against a button raise, or misjudging a wet board. The natural temptation is to drill what you are already good at, because it feels nice to be right. Resist it. The fastest gains come from the spots that make you wince.`,
          `The app is built to help here. The trainers use "leak weighting" — spots you miss are served to you more often until you fix them — so simply doing the reps steers you toward your weaknesses automatically. The Dashboard goes further: it lists your top leaks, each with a one-tap button that drops you straight into drilling that spot, so you can attack a weakness directly. A good drill is to pick one leak — one seat, one kind of spot — and grind it until the right answer is automatic, then move to the next.`,
        ],
      },
      {
        heading: 'Reviewing your play in the Simulator',
        body: [
          `Doing reps builds speed, but reviewing your reps builds understanding — and you want both. It is not enough to know what the right play was; you want to know why, because the "why" is what transfers to the next hand that is a little different.`,
          `The Simulator has a Coach, or Learning mode, for exactly this. As you play, it explains each spot in plain English — what an opponent's action suggests, what it would do on your turn and the reason behind it, and a short recap with a lesson at showdown. It is advisory only; you still make every decision yourself, but you get a tutor's read alongside it.`,
          `The Simulator also keeps a hand-history log of the hands you have played, so you can look back at how a hand actually went instead of relying on memory. Replaying a hand you lost and asking "was my decision wrong, or did I just get unlucky?" is one of the most valuable habits in poker — and it leads straight into the right mindset, below.`,
        ],
      },
      {
        heading: 'Build the habit: small and nightly',
        body: [
          `The people who improve are not the ones who binge for six hours once a month. They are the ones who do a little, often. Twenty focused minutes most nights will beat a rare marathon every time, because spacing your reps out is how memory actually sticks — which is also the whole idea behind the Concept Deck.`,
          `The Concept Deck is a flashcard system with spaced repetition: it shows you a concept, you rate how well you knew it, and it schedules each card to come back right before you would forget it. Cards you find hard resurface soon; cards you have mastered space out over days and weeks. A few minutes on it per session quietly locks the fundamentals into long-term memory.`,
          `To anchor the habit, the Dashboard tracks a nightly streak — the number of days in a row you have practiced. It sounds small, but "don't break the streak" is a genuinely powerful motivator. Aim to open the app and do something every evening, even if it is just a short range session. Consistency compounds.`,
        ],
      },
      {
        heading: 'A realistic mindset: decisions, not results',
        body: [
          `Two things to make peace with early, because they trip up almost every beginner.`,
          `First, improvement is gradual. You will not feel dramatically better after one night — you will feel better after a month of nights. The accuracy numbers on the Dashboard are there precisely so you can see the slow climb that day-to-day play hides. Trust the curve.`,
          `Second, poker has "variance" — short-term luck. The cards are random, so you can play a hand perfectly and still lose it, or play badly and win. Over a single session, even a long one, luck can swamp skill entirely. This is why you must judge yourself on your decisions, not your results: ask "did I make the right choice with the information I had?" not "did I win the pot?" Good decisions win over time even when they lose tonight. Chasing results — changing a correct play because it lost once — is how good players turn into bad ones.`,
        ],
      },
      {
        heading: 'How to practice this: a simple nightly loop',
        body: [
          `Pull it together into a routine you can actually keep. A solid nightly loop looks like this: a few minutes of the Concept Deck to warm up and review, a Range Trainer session as your daily foundation, then one other trainer — Odds, Board, or Postflop — picking whichever the Dashboard says is your weakest. Finish with a few hands in the Simulator with Coach mode on to see it all in motion.`,
          `Before you close the app, glance at the Dashboard: check your streak ticked up, note your top leak, and you will know exactly where to start tomorrow. Keep that loop going, judge yourself on decisions, and the improvement takes care of itself. Tap "Simulator" or "Concept Deck" above to start tonight.`,
        ],
      },
    ],
  },
  {
    id: 'live-vegas',
    number: 6,
    title: 'Live play & Vegas prep',
    description: 'Etiquette, mechanics, and bankroll — so your first live session feels natural.',
    trainers: [{ view: 'live', label: 'Live Toolkit' }],
    sections: [
      {
        heading: "What's different about live poker",
        body: [
          `You have built the skills. Now the setting changes: instead of a screen, you are at a physical table in a casino, with a dealer, real chips, and eight other people. This phase is about crossing that bridge — getting ready for live $1/$2 or $1/$3 cash, the lowest common in-person stakes and the right place to start.`,
          `Three things feel different live. It is much slower — you might see 25 to 30 hands an hour, versus hundreds online — so patience becomes a real skill. It is in person, so there are actual people to read and be read by. And there are physical mechanics and etiquette — how you handle chips, how you make a bet, how you behave at the table — that simply do not exist on a screen.`,
          `Here is the reassuring part: the poker itself is identical. Every range, pot-odds calculation, board read, and postflop line you have drilled works exactly the same live as online — the fundamentals transfer completely. What is new is only the wrapper around them: the mechanics and the manners. Learn that wrapper and your first session will feel natural instead of nerve-wracking.`,
        ],
      },
      {
        heading: 'Bankroll discipline: play within your roll',
        body: [
          `Your "bankroll" is the money you have set aside specifically for poker — separate from rent, bills, and everyday life. It is not the cash in your pocket tonight; it is a dedicated fund you play from and never dip into for anything else.`,
          `The core rule for live cash: a "buy-in" is the amount you sit down with, standardly 100 big blinds. At $1/$2 the big blind is $2, so a buy-in is about $200; at $1/$3 it is about $300. Then keep enough buy-ins in your roll to survive bad luck: at least 20 buy-ins for a stake as a minimum, and 30 or more to be comfortable. For $1/$2 that means roughly $4,000 minimum and $6,000 comfortable; for $1/$3, about $6,000 and $9,000.`,
          `Why so much? Because "variance" — short-term luck — is real and swingy. Even a genuinely winning player goes through losing stretches of many buy-ins; that is normal, not a sign you are bad. A big enough roll means an ordinary downswing cannot bust you. Too small a roll, and bad luck alone can end your poker before your skill ever gets to matter.`,
          `Hold this framing firmly: live poker is a craft with strict money rules, not an income plan. Do not sit down expecting it to pay your bills, and never reload with money you cannot afford to lose. Play the stake your roll covers, move up only when the roll says you can, and the whole thing stays fun and sustainable. The Live Toolkit's Bankroll tab does this math for you — enter your roll and it tells you which stakes you are comfortably rolled for, at the minimum edge, or under-rolled for, using exactly these thresholds.`,
        ],
      },
      {
        heading: 'Table mechanics and etiquette',
        body: [
          `A dealer runs the game. A disc called the "button" marks the dealer position and moves one seat clockwise each hand; the two players to its left post the small and big blinds. You simply play your position exactly as you learned in Phase 1 — the button is still the button.`,
          `Act in turn. Wait for the players before you to act, then act — going early ("out of turn") gives away information and can be penalized, so watch the action and know when it is on you. And know that verbal declarations are binding: if you say "raise," "call," or "fold" in turn, you are held to it. Use that to your advantage by announcing your action out loud.`,
          `The classic beginner mistake is a "string bet" — putting chips out for a raise in more than one motion (say, chips to call, then reaching back for more). The dealer will rule it a call and kill your raise. Avoid it two ways: announce "raise" before you touch a chip (verbal is binding), or bring all your chips out in one clean motion. A related rule: if you put out a single oversized chip (bigger than the bet) without saying "raise," it counts as a call and the dealer makes change — so announce "raise" first if that is what you mean.`,
          `A few more table manners. Protect your hand — keep your two cards on the table with a chip on top; an unprotected hand the dealer accidentally sweeps into the "muck" (the discard pile) is dead, with no recourse. Keep your chips in neat, visible stacks, and place bets in front of you rather than tossing them into the middle ("splashing the pot"). It is customary to tip the dealer a small amount — often about a dollar — when you win a pot and when you leave after a winning session; it is part of their income. And be aware of the "rake," the small cut the house takes from most pots to run the game.`,
          `One caveat matters more than any single rule: house rules vary by room. Whether you can "straddle" (post an optional extra blind for last action preflop), how "posting" works when you first sit down, the single-oversized-chip rule, whether "show one, show all" is enforced, and even whether cash on the table plays — all of these differ from casino to casino. When you are not sure, just ask the dealer or the floor. There is zero shame in it; a careful question marks you as a considerate player, not a clueless one, and every dealer would rather answer than untangle a misunderstanding.`,
        ],
      },
      {
        heading: 'Your first live session',
        body: [
          `Keep it simple and set yourself up to succeed. Pick a low-stakes game — $1/$2 or $1/$3 is exactly right — and buy in for a full stack (100 big blinds) so you can play properly and win a full stack when you make a big hand. Do not short-buy for less; it just handcuffs you.`,
          `Play tight-aggressive and lean on your preflop foundation from Phase 1: play solid ranges, fold the junk, and when you do play, bet and raise rather than call. Live low-stakes games are often loose and passive — full of players who limp in and call too much — so straightforward, disciplined, aggressive poker is genuinely profitable there. You do not need fancy plays; you need to keep doing the fundamentals you have drilled.`,
          `Do not be intimidated. Everyone at the table was new once, the regulars are not as scary as they look, and you have very likely studied the game more than most $1/$2 players ever will. Take your time on decisions — live poker is slow and you are allowed to think. A few extra seconds to count your outs or recall a range is completely normal; never rush a decision just because you feel watched. Your first session, it is perfectly fine to be quiet, watch closely, focus on clean mechanics, and let the reps build your comfort.`,
        ],
      },
      {
        heading: 'Track your play',
        body: [
          `If you want to know whether you are actually a winning player, you have to track your results — because memory lies. A couple of big wins feel like proof you are crushing, while the quiet losing nights fade from memory. Only a record tells the truth.`,
          `Log every session: your buy-in, your cash-out, and the hours you played. Over time that gives you two numbers that matter — your true net profit and your hourly rate (dollars won per hour) — which together are the real scoreboard. One session tells you almost nothing, because variance dominates the short run; but dozens of sessions start to reveal your genuine win rate, and that is what tells you whether to move up, keep grinding, or study more.`,
          `The Live Toolkit's Sessions tab is built for exactly this. Enter each session's buy-in, cash-out, and hours, and it computes your net profit, hourly rate, win rate, and biggest results automatically — so your progress is a fact you can see, not a feeling you have to trust.`,
        ],
      },
      {
        heading: 'A healthy, realistic mindset',
        body: [
          `Play within your roll, every time. The bankroll rules above are not optional suggestions — they are what keep poker a fun, sustainable hobby instead of a way to lose money you actually need. Discipline off the felt is what buys you freedom on it.`,
          `Treat poker as a skill you are honing, and play sober and rested. The entire edge comes from making clear, correct decisions; alcohol and "tilt" (emotional, reckless play after a bad beat) quietly wreck exactly that. Protect your decision-making and you protect your results.`,
          `And remember that results come over the long run. You can play a flawless session and still lose, or a sloppy one and win — over a single night, luck can completely swamp skill. So judge yourself on your decisions, not one evening's outcome, just as you learned in Phase 5. Keep making good choices and the money follows over months, not hours. A night at $1/$2 is entertainment and practice for a craft you are building — not a paycheck. Go in to enjoy the game and play well, and treat the winnings as the long-run byproduct of doing that.`,
        ],
      },
      {
        heading: 'How to practice this',
        body: [
          `Two things get you ready. First, put in reps in the Simulator before you go — playing full hands against the bots makes the flow of a live hand (the betting rounds, the sizing, the showdown) second nature, so at the table you can spend your attention on the people and the etiquette instead of the mechanics. Keep sharpening the fundamentals between sessions too, especially the Range Trainer, since live reps are slow and precious.`,
          `Second, lean on the Live Toolkit. Use the Bankroll tab to confirm you are rolled for your stake before you sit, the Etiquette reference to review the mechanics before you walk in (and to look up anything that surprised you afterward), and the Sessions tab to log every session and watch your real results build over time. Then go sit down, play within your roll, take your time, and enjoy it — you are ready. Tap "Live Toolkit" above.`,
        ],
      },
    ],
  },
]

// Lookup helper for the article router.
export function getPhase(id) {
  return PHASES.find((p) => p.id === id) ?? null
}
