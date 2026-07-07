// Thin, safe localStorage wrapper.
//
// - All keys are namespaced under a single PREFIX so the app never collides with
//   other localStorage users.
// - get/set/remove NEVER throw: a missing key, corrupt JSON, unavailable
//   localStorage (SSR / Node / private-mode quota), or a failed write all resolve
//   to a sensible fallback instead of crashing a trainer mid-session.
// - SCHEMA_VERSION is persisted so future schema changes can detect and migrate
//   (or discard) old data rather than silently misreading it.

export const PREFIX = 'poker-trainer:'
export const SCHEMA_VERSION = 1

const META_KEY = 'meta'

/** @returns {Storage|null} the Storage backend, or null if unavailable. */
function backend() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage
  } catch {
    // Accessing localStorage can throw (e.g. sandboxed iframe) — treat as absent.
  }
  return null
}

const nsKey = (key) => `${PREFIX}${key}`

/**
 * Read + JSON-parse a namespaced key. Returns `fallback` if missing/corrupt.
 * @template T
 * @param {string} key
 * @param {T} [fallback]
 * @returns {T}
 */
export function get(key, fallback = null) {
  const store = backend()
  if (!store) return fallback
  try {
    const raw = store.getItem(nsKey(key))
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

/**
 * JSON-stringify + write a namespaced key.
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean} true on success, false if storage was unavailable/failed.
 */
export function set(key, value) {
  const store = backend()
  if (!store) return false
  try {
    store.setItem(nsKey(key), JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * Remove a namespaced key. No-op if storage is unavailable.
 * @param {string} key
 */
export function remove(key) {
  const store = backend()
  if (!store) return
  try {
    store.removeItem(nsKey(key))
  } catch {
    // ignore
  }
}

/** @returns {number|null} the persisted schema version, or null if never written. */
export function getSchemaVersion() {
  const meta = get(META_KEY, null)
  return meta && typeof meta.version === 'number' ? meta.version : null
}

// Stamp the current schema version once, on first use, if none is present yet.
// A future version bump detected here is where a migration would run; for v1 we
// only write when absent so older data stays detectable rather than clobbered.
function ensureSchema() {
  if (getSchemaVersion() === null) {
    set(META_KEY, { version: SCHEMA_VERSION })
  }
}

ensureSchema()
