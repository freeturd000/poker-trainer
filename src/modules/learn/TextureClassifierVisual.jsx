// Learn visual — the live board-texture classifier (Phase 3).
//
// Renders a flop with the shared <Card /> and shows the EXACT tags the Board
// Reader's real classifier returns (dry/wet/paired/monotone/two-tone) plus its
// one-line "why". Nothing here re-derives texture: tags and reasoning come from
// classifyTexture() in /src/modules/board-reader, so this visual matches the
// trainer by construction. The user can cycle curated illustrative flops (one per
// texture) or deal a random flop to watch the same classifier react live.

import { useState } from 'react'
import Card from '../../components/Card.jsx'
import { createDeck, shuffle } from '../../engine/deck.js'
import { classifyTexture, TEXTURE_TAGS } from '../../modules/board-reader/texture.js'

// Curated flops, one clear archetype per texture. These are illustrative layouts
// only — every tag and explanation shown is produced by classifyTexture at render
// time, never hardcoded, so they stay honest even if the heuristic is retuned.
const EXAMPLES = [
  { flop: ['Ks', '7d', '2c'], note: 'A clear dry board' },
  { flop: ['9h', '8s', '7d'], note: 'A wet, connected board' },
  { flop: ['Ah', '9h', '4h'], note: 'A monotone board' },
  { flop: ['Ks', 'Kd', '7c'], note: 'A paired board' },
  { flop: ['Qh', '7h', '2c'], note: 'A two-tone board' },
  { flop: ['9s', '8s', '7d'], note: 'Wet and two-tone — as dangerous as it gets' },
]

// One-word gloss shown under each tag chip, so a beginner reads the label, not jargon.
const TAG_GLOSS = {
  dry: 'disconnected',
  wet: 'connected',
  paired: 'a pair on board',
  monotone: 'all one suit',
  'two-tone': 'two suits',
}

export default function TextureClassifierVisual() {
  const [idx, setIdx] = useState(0)
  const [flop, setFlop] = useState(EXAMPLES[0].flop)
  const [note, setNote] = useState(EXAMPLES[0].note)

  const classify = classifyTexture(flop)

  const nextExample = () => {
    const i = (idx + 1) % EXAMPLES.length
    setIdx(i)
    setFlop(EXAMPLES[i].flop)
    setNote(EXAMPLES[i].note)
  }

  const dealRandom = () => {
    setFlop(shuffle(createDeck()).slice(0, 3))
    setNote('A random flop')
  }

  // Show tags in the classifier's canonical order for a stable, readable row.
  const tags = [...classify.tags].sort((a, b) => TEXTURE_TAGS.indexOf(a) - TEXTURE_TAGS.indexOf(b))

  return (
    <div className="not-prose mt-4 rounded-xl border border-line bg-surface-sunken-soft p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-ink-heading">Texture classifier</div>
          <div className="truncate text-xs text-ink-muted">{note}</div>
        </div>
        <span
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold ${
            classify.wet ? 'bg-danger-soft text-danger-text' : 'bg-accent-soft text-accent-text'
          }`}
        >
          {classify.wet ? 'WET' : 'DRY'}
        </span>
      </div>

      {/* The flop */}
      <div className="mt-4 flex justify-center gap-2">
        {flop.map((c) => (
          <Card key={c} card={c} size="md" />
        ))}
      </div>

      {/* The tags the real classifier returns */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="flex flex-col items-center rounded-lg border border-line bg-surface-inset px-3 py-1.5"
          >
            <span className="text-sm font-bold text-ink-heading">{t}</span>
            <span className="text-[0.65rem] uppercase tracking-wide text-ink-muted">{TAG_GLOSS[t]}</span>
          </span>
        ))}
      </div>

      {/* The classifier's own one-line "why" */}
      <p className="mt-4 text-sm leading-relaxed text-ink-body">{classify.why}</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={nextExample}
          className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-onfelt transition hover:bg-accent-hover"
        >
          Next example →
        </button>
        <button
          onClick={dealRandom}
          className="w-full rounded-lg border border-line-strong bg-surface-inset py-2 text-sm font-semibold text-ink-body transition hover:bg-surface-raised"
        >
          Deal random flop
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-ink-muted">
        Tags and reasoning come straight from the Board Reader's classifier — the same one the Texture ID drill
        grades you against.
      </p>
    </div>
  )
}
