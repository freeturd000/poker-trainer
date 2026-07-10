// <Term> — a reusable, beginner-clarity affordance. Renders a term with a subtle
// dotted underline that, on tap/click (or hover on desktop), pops a small plain-
// English definition from the shared glossary. One component, wired into the
// recurring jargon across every module so a lost beginner always has somewhere to
// tap.
//
// Design notes:
//   • Renders a <span role="button">, never a real <button>, so it is safe to nest
//     inside buttons/labels without invalid markup or breaking layout.
//   • Tap toggles the popover; tapping outside (or Escape) closes it. Desktop hover
//     opens/closes it too. stopPropagation keeps a tap from also triggering a parent.
//   • Theme-aware: the popover uses the shared surface/ink tokens, so it reads in
//     both light and dark. Font size/case are reset so it looks right even when the
//     term sits inside a large or UPPERCASE label.
//   • If the id is unknown and no `def` is given, it renders the text plainly with
//     no affordance — it can never blank out or break the surrounding copy.

import { useEffect, useId, useRef, useState } from 'react'
import { GLOSSARY } from './glossary.js'

/**
 * @param {object} props
 * @param {string} [props.id]        - glossary key (e.g. 'CO', 'equity')
 * @param {string} [props.def]       - explicit definition, overrides the glossary lookup
 * @param {import('react').ReactNode} [props.children] - visible label; defaults to `id`
 * @param {string} [props.className] - extra classes on the underlined term
 */
export default function Term({ id, def, children, className = '' }) {
  const definition = def ?? (id != null ? GLOSSARY[id] : undefined)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const tipId = useId()

  // Close on outside pointer-down or Escape while open. Only attached when open, so
  // the tap that opens the popover never immediately closes it.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const label = children ?? id
  // No definition available → render the text plainly; never break the copy.
  if (!definition) return <>{label}</>

  const toggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen((o) => !o)
  }

  return (
    <span ref={wrapRef} className="relative inline-block">
      <span
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') toggle(e)
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className={`cursor-help underline decoration-dotted decoration-1 underline-offset-4 ${className}`}
      >
        {label}
      </span>
      {open && (
        <span
          role="tooltip"
          id={tipId}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-1/2 top-full z-50 mt-1.5 w-max max-w-[min(20rem,80vw)] -translate-x-1/2 whitespace-normal break-words rounded-lg border border-line bg-surface px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-ink-body shadow-xl"
        >
          {definition}
        </span>
      )}
    </span>
  )
}
