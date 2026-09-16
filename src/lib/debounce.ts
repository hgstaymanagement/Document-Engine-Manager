/**
 * Keeps one timer per key so unrelated things being edited at once (e.g. two
 * different forms) don't cancel each other's pending save. Call schedule()
 * on every change; the callback fires once, `delayMs` after the last call
 * for that key.
 */
export function createDebouncer(delayMs = 800) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function schedule(key: string, fn: () => void) {
    const existing = timers.get(key)
    if (existing) clearTimeout(existing)
    timers.set(
      key,
      setTimeout(() => {
        timers.delete(key)
        fn()
      }, delayMs)
    )
  }

  /** Run a key's pending callback immediately (e.g. on blur / explicit Save). */
  function flush(key: string, fn: () => void) {
    const existing = timers.get(key)
    if (existing) {
      clearTimeout(existing)
      timers.delete(key)
    }
    fn()
  }

  return { schedule, flush }
}
