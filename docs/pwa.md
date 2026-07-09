# PWA / Install & Offline

The app is a Progressive Web App: it can be **installed** to your home screen and
**works fully offline** once installed. This is config-only — no module logic,
engine, ranges, or Learn content was changed.

## What's wired up

- **Web app manifest** (`vite.config.js` → `VitePWA({ manifest })`): name
  "Poker Trainer", `display: standalone`, green-felt theme/background
  (`#065f46`, emerald-800), icons at 192 / 512 / maskable.
- **Service worker** via `vite-plugin-pwa` (Workbox `generateSW`): precaches the
  built app shell + all static assets so the whole app loads offline.
  `registerType: 'autoUpdate'` — a new build's SW installs and takes over on the
  next visit automatically.
- **Icons** live in `public/`: `pwa-192.png`, `pwa-512.png`,
  `maskable-512.png`, `apple-touch-icon.png` (180px, for iOS).
- **iOS meta tags** in `index.html` (`apple-touch-icon`, `apple-mobile-web-app-*`).

**localStorage is unaffected.** The service worker only caches static assets
(JS/CSS/HTML/icons/JSON). All progress, leak stats, and session logs still read
and write to `localStorage` exactly as before — offline included.

## Dev vs. production

- `npm run dev` — unchanged. The service worker is **disabled** in dev
  (`devOptions.enabled: false`) so there's no caching to fight while editing.
- `npm run build` — produces `dist/` with `manifest.webmanifest`, `sw.js`, and
  the precache manifest. This is the installable build.

## Test install + offline on your computer

```bash
npm run build      # generates the PWA in dist/
npm run preview     # serves the production build (default http://localhost:4173)
```

1. Open the preview URL in **Chrome or Edge** (desktop).
2. You'll see an **install icon** in the address bar (a monitor/⊕ icon), or use
   the ⋮ menu → "Install Poker Trainer…". Click it — the app opens in its own
   standalone window with the spade icon.
3. To confirm offline: DevTools → **Application** tab → **Service Workers**
   (should show `sw.js` activated) → check **Offline**, then reload. The app
   still loads and works. Or just stop `npm run preview` and reload the
   installed window.

> Note: installability requires the production build (`preview`), not `dev`.
> Browsers also require `localhost` or HTTPS — both `preview` and a deployed
> HTTPS site qualify.

## Install on your phone

Easiest path is to deploy `dist/` to any HTTPS host (Cloudflare Pages, Netlify,
etc.) — a service worker + install prompt require HTTPS on a real domain.

**iPhone (Safari):**
1. Open the site's HTTPS URL in **Safari** (must be Safari, not Chrome).
2. Tap the **Share** button → scroll down → **Add to Home Screen** → **Add**.
3. It appears on your home screen with the spade icon and opens full-screen
   (no Safari chrome). Works offline after the first load.

**Android (Chrome):**
1. Open the HTTPS URL in **Chrome**.
2. Either tap the **"Install app" / "Add to Home screen"** banner that pops up,
   or ⋮ menu → **Install app**.
3. It installs like a native app and works offline.

### Testing on your phone without deploying (same Wi-Fi)

`npm run preview -- --host` prints a `Network:` URL (e.g. `http://192.168.x.x:4173`).
You can open that on your phone to preview the app, **but** iOS/Android will not
offer a true install or run the service worker over plain `http://` to a LAN IP —
only over `localhost` or HTTPS. So for a real install test on-device, deploy to
HTTPS. The desktop `localhost` test above fully exercises install + offline.

## Customize later (placeholders)

- **Icons** — `public/pwa-192.png`, `pwa-512.png`, `maskable-512.png`, and
  `apple-touch-icon.png` are **generated placeholders** (a white spade on the
  felt-green gradient). Replace them with your own art at the same filenames and
  sizes; keep the maskable one's content inside the center ~80% safe zone.
  The generator script is in scratch (not committed).
- **Name / description** — edit `manifest` in `vite.config.js` (`name`,
  `short_name`, `description`) and the `<meta name="description">` /
  `apple-mobile-web-app-title` in `index.html`.
- **Colors** — `theme_color` / `background_color` in the manifest and the
  `theme-color` meta in `index.html` (currently `#065f46`).
