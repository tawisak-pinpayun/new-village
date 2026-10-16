export const WORLD_DAY_MS = 24 * 60_000
export const WORLD_CALENDAR_VERSION = 3
// Stable fallback for local play or temporary database outages. MongoDB stores the chosen epoch.
export const DEFAULT_WORLD_EPOCH_MS = Date.UTC(2026, 9, 15)

export function worldDay(now, epochMs = DEFAULT_WORLD_EPOCH_MS) {
  return Math.max(1, Math.floor(Math.max(0, now - epochMs) / WORLD_DAY_MS) + 1)
}

export function worldProgress(now, epochMs = DEFAULT_WORLD_EPOCH_MS) {
  return Math.max(0, now - epochMs) % WORLD_DAY_MS / WORLD_DAY_MS
}
