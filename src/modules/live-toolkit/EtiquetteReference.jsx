// Live etiquette & mechanics reference (CLAUDE.md §4 Module 7, part 3).
//
// A static, scannable reference rendered from ../../data/live-etiquette.json. No
// state beyond which section is expanded — all content lives in the data file so it's
// easy to grow without touching this component. Beginner-friendly by design.

import { useState } from 'react'
import reference from '../../data/live-etiquette.json'

export default function EtiquetteReference() {
  // All sections open by default (it's a reference you scan); tapping a header toggles.
  const [collapsed, setCollapsed] = useState({})
  const toggle = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-sm text-onfelt-2">
        The in-person basics that trip up first-timers. Skim before your first session.
      </p>

      {reference.sections.map((section) => {
        const isCollapsed = collapsed[section.id]
        return (
          <div key={section.id} className="overflow-hidden pt-card">
            <button
              onClick={() => toggle(section.id)}
              className="flex w-full items-center justify-between bg-felt-rail px-5 py-3 text-left"
            >
              <span className="font-bold text-onfelt">{section.title}</span>
              <span className="text-onfelt-2">{isCollapsed ? '+' : '−'}</span>
            </button>
            {!isCollapsed && (
              <dl className="divide-y divide-line">
                {section.items.map((item) => (
                  <div key={item.id} className="px-5 py-3">
                    <dt className="text-sm font-bold text-ink-heading">{item.term}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-ink-body">{item.body}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )
      })}

      <p className="px-2 text-center text-[11px] text-onfelt-4">
        Rules and room policies vary by casino and jurisdiction — when in doubt, ask your dealer or
        the floor. This is a primer, not the house rulebook.
      </p>
    </div>
  )
}
