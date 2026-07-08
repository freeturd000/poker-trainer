// Coach mode's explanation panel for the simulator (CLAUDE.md §4, Module 5).
//
// A single, visually distinct card (indigo accent, "COACH" tag) that renders the
// plain-English guidance produced by ./coach.js. It owns no poker logic — it just
// displays one of three content shapes:
//   • { kind: 'bot',    text }                    — read on an opponent's action
//   • { kind: 'advice', action, reason, approx }  — a suggestion on hero's turn
//   • { kind: 'result', summary, lesson }         — the showdown recap
// Deliberately separate from the felt/table styling so explanations read as a
// tutor's aside, not part of the game surface.

function Shell({ children }) {
  return (
    <div className="mb-3 rounded-2xl border border-indigo-400/40 bg-indigo-950/80 p-3.5 text-left shadow-lg">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="rounded bg-indigo-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-950">
          Coach
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-300">
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
        <p className="text-sm leading-snug text-indigo-100">{content.text}</p>
      </Shell>
    )
  }

  if (content.kind === 'advice') {
    return (
      <Shell>
        <p className="text-sm leading-snug text-indigo-100">
          <span className="font-bold text-white">Coach suggests: {content.action}.</span>{' '}
          {content.reason}
        </p>
        <p className="mt-1.5 text-[11px] italic text-indigo-300/80">
          A heuristic guide to learn from — not gospel. It's your call; play it however you like.
        </p>
      </Shell>
    )
  }

  // result
  return (
    <Shell>
      <p className="text-sm font-semibold leading-snug text-white">{content.summary}</p>
      <p className="mt-1 text-sm leading-snug text-indigo-100">{content.lesson}</p>
    </Shell>
  )
}
