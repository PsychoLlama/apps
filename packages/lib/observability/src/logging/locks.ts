/**
 * Prefix shared by every per-session log-file Web Lock. The lock registry is
 * origin-global, so namespacing keeps these locks distinct from any unrelated
 * holder and lets {@link listActiveLogFiles} pick out just the log-file locks.
 */
const LOG_LOCK_PREFIX = 'observability:';

/** The Web Lock name a session holds for the lifetime of its log file. */
const lockName = (file: string): string => `${LOG_LOCK_PREFIX}${file}`;

/**
 * Take a Web Lock named for this session's log `file` and hold it for the
 * realm's entire lifetime — the lock callback returns a promise that never
 * settles, so the lock releases only when the tab (or worker) is torn down.
 *
 * This is the signal other tabs read via {@link listActiveLogFiles} to tell which
 * sessions are still streaming. Fire-and-forget: a uniquely-named exclusive
 * lock is granted immediately and is never contended, so there's nothing to
 * await.
 */
export const holdLogFileLock = (file: string): void => {
  void navigator.locks.request(
    lockName(file),
    () => new Promise<never>(() => {}),
  );
};

/**
 * The log-file names whose owning session is still active — each holds its Web
 * Lock (see {@link holdLogFileLock}). Reads a one-shot snapshot via
 * `navigator.locks.query`, so it reflects the instant it's called; reactivity is
 * layered on separately.
 *
 * Names come back matching `LogFileInfo.name`, so a viewer can intersect them
 * with the enumerated archive to badge the active sessions.
 */
export const listActiveLogFiles = async (): Promise<string[]> => {
  const { held = [] } = await navigator.locks.query();

  return held
    .map((lock) => lock.name)
    .filter(
      (name): name is string => name?.startsWith(LOG_LOCK_PREFIX) ?? false,
    )
    .map((name) => name.slice(LOG_LOCK_PREFIX.length));
};
