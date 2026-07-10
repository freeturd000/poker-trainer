// Coach mode's explanation panel for the simulator (CLAUDE.md §4, Module 5).
//
// A single, visually distinct card (indigo accent, "COACH" tag) that renders the
// plain-English guidance produced by ./coach.js. It owns no poker logic — it just
// displays one of three content shapes:
//   • { kind: 'bot',    text }                    — read on an opponent's action
//   • { kind: 'advice', action, reason, approx, context }  — a suggestion on hero's
//     turn, optionally preceded by a "what just happened" line reading opponents'
//     most recent meaningful action
//   • { kind: 'result', summary, lesson, showdown? } — the showdown recap; when the
//     hand reached showdown, `showdown` carries a ranked, plain-English breakdown of
//     every hand shown (best → worst) and a one-line "why the winner won"
// Deliberately separate from the felt/table styling so explanations read as a
// tutor's aside, not part of the game surface.

import Card from '../../components/Card.jsx'
import Term from '../../components/Term.jsx'

function Shell({ children }) {
  return (
    <div className="mb-3 rounded-2xl border border-special/40 bg-panel/80 p-3.5 text-left shadow-lg">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="rounded bg-special px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-felt-deep">
          Coach
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-special">
          Learning mode
        </span>
      </div>
      {children}
    </div>
  )
}

export default function CoachPanel({ content }) {
  if (!content) return null

  if (content.kind === 'bot') {
    return (
      <Shell>
        <p className="text-sm leading-snug text-onfelt-2">{content.text}</p>
      </Shell>
    )
  }

  if (content.kind === 'advice') {
    const size = content.sizing
    return (
      <Shell>
        {content.context && (
          <p className="mb-2 border-l-2 border-special/50 pl-2.5 text-sm leading-snug text-onfelt">
            {content.context}
          </p>
        )}
        <p className="text-sm leading-snug text-onfelt-2">
          <span className="font-bold text-onfelt">Coach suggests: {content.action}.</span>{' '}
          {content.reason}
        </p>
        {size?.amount != null && (
          <p className="mt-1.5 text-sm font-semibold leading-snug text-onfelt">
            How much: {content.action.toLowerCase()} {size.label}
            {' '}
            <span className="tabular-nums text-gold-text">(≈{size.amount} chips)</span>. The bet
            slider is set here — nudge it to bet more or less.
          </p>
        )}
        <p className="mt-1.5 text-[11px] italic text-special/80">
          A heuristic guide to learn from — not gospel. It's your call; play it however you like.
        </p>
      </Shell>
    )
  }

  // result
  return (
    <Shell>
      <p className="text-sm font-semibold leading-snug text-onfelt">{content.summary}</p>
      {content.showdown && <ShowdownBreakdown showdown={content.showdown} />}
      <p className="mt-2 text-sm leading-snug text-onfelt-2">{content.lesson}</p>
    </Shell>
  )
}

// The at-showdown breakdown: every hand shown, ranked best → worst with its plain-
// English made hand and hole cards, then a one-line "why". Pure presentation — all
// naming, ranking, and the verdict come from ./coach.js (via the /engine evaluator).
function ShowdownBreakdown({ showdown }) {
  return (
    <div className="mt-2.5 rounded-xl border border-special/25 bg-special/5 p-2.5">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-special">
        <Term id="showdown">Showdown</Term> — best hand to worst
      </p>
      <ol className="space-y-1.5">
        {showdown.rows.map((r, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className={`w-3 shrink-0 text-right text-xs tabular-nums ${
                r.isWinner ? 'font-bold text-gold-text' : 'text-onfelt-3'
              }`}
            >
              {i + 1}
            </span>
            <span className="flex shrink-0 gap-1">
              <Card card={r.hole[0]} size="sm" />
              <Card card={r.hole[1]} size="sm" />
            </span>
            <span className="text-sm leading-snug">
              <span className={`font-semibold ${r.isWinner ? 'text-gold-text' : 'text-onfelt'}`}>
                {r.name}
                {r.isWinner ? ' — winner' : ''}:
              </span>{' '}
              <span className="text-onfelt-2">{r.made}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-sm leading-snug text-onfelt-2">
        <span className="font-semibold text-onfelt">Why: </span>
        {showdown.verdict}
      </p>
      <p className="mt-1 text-[11px] italic text-special/80">
        Every hand slots into poker's <Term id="handrankings">hand-ranking order</Term>.
      </p>
    </div>
  )
}
