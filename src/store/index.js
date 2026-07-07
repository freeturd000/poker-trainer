// Public store API. Modules should import from here (e.g. `../store`), not from
// the individual files, so the surface stays stable if internals move.

export { PREFIX, SCHEMA_VERSION, get, set, remove, getSchemaVersion } from './storage.js'
export { getProgress, recordAttempt } from './progress.js'
export { recordLeak, getLeaks, getLeakWeight } from './leaks.js'
