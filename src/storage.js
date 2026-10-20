// localStorage helpers. Keys are versioned so a future schema change can't
// load stale data, and every access is wrapped because storage throws in
// private browsing or when it's full.

export const KEYS = {
  game: 'undercover:game:v1',
  settings: 'undercover:settings:v1',
  lastPair: 'undercover:lastPair:v1',
}

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Không lưu được thì vẫn chơi tiếp bình thường, chỉ mất khả năng khôi phục.
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}
