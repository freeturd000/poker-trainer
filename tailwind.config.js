/** @type {import('tailwindcss').Config} */

// Every app colour is a semantic token backed by a CSS custom property (defined
// per-theme in src/index.css). Tokens use the `rgb(var(--x) / <alpha-value>)`
// form so Tailwind opacity modifiers (e.g. `bg-panel/40`, `text-onfelt-2`) keep
// working. Components reference these names instead of literal palette shades, so
// the whole app re-themes by swapping the variables — no per-component edits.
const token = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Felt / chrome surfaces (the green table + app frame)
        felt: token('--felt'),
        'felt-deep': token('--felt-deep'),
        'felt-rail': token('--felt-rail'),
        panel: token('--panel'), // translucent panels that sit on the felt

        // Light panel surfaces (article cards, trainer cards, insets)
        surface: token('--surface'),
        'surface-raised': token('--surface-raised'),
        'surface-inset': token('--surface-inset'),
        'surface-sunken': token('--surface-sunken'),
        'surface-sunken-soft': token('--surface-sunken-soft'),
        'accent-soft': token('--accent-soft'),

        // Text on light surfaces (flips light↔dark with the theme)
        ink: token('--ink'),
        'ink-heading': token('--ink-heading'),
        'ink-body': token('--ink-body'),
        'ink-muted': token('--ink-muted'),

        // Text on the felt / dark chrome (stays light in both themes)
        onfelt: token('--onfelt'),
        'onfelt-2': token('--onfelt-2'),
        'onfelt-3': token('--onfelt-3'),
        'onfelt-4': token('--onfelt-4'),

        // Green accent family
        accent: token('--accent'),
        'accent-hover': token('--accent-hover'),
        'accent-bright': token('--accent-bright'),
        'accent-text': token('--accent-text'),

        // State colours
        danger: token('--danger'),
        'danger-solid': token('--danger-solid'),
        'danger-hover': token('--danger-hover'),
        'danger-soft': token('--danger-soft'),
        'danger-text': token('--danger-text'),
        info: token('--info'),
        'info-bright': token('--info-bright'),
        gold: token('--gold'),
        'gold-soft': token('--gold-soft'),
        'gold-text': token('--gold-text'),
        'gold-ink': token('--gold-ink'),
        special: token('--special'),

        // Poker card faces — deliberately fixed (light card on dark reads real)
        'card-face': token('--card-face'),
        'card-ink': token('--card-ink'),
        'card-red': token('--card-red'),
        'card-edge': token('--card-edge'),
        'card-back': token('--card-back'),
        'card-back-edge': token('--card-back-edge'),
        'card-back-pip': token('--card-back-pip'),

        // Borders
        line: token('--line'),
        'line-strong': token('--line-strong'),
        'line-felt': token('--line-felt'),
      },
    },
  },
  plugins: [],
}
