/**
 * Follow what other tabs store under `key`, passing each write through
 * `parse` to `notify`, until the returned function stops it. A cleared
 * store reads as `null`. `storage` events never fire in the tab that
 * wrote the value.
 *
 * @internal
 */
export const watchStorage = <T>(
  key: string,
  parse: (stored: string | null) => T,
  notify: (value: T) => void,
): (() => void) => {
  const listener = (event: StorageEvent) => {
    if (event.storageArea !== localStorage) return;

    // A `null` key means storage was cleared.
    if (event.key === key || event.key === null) {
      notify(parse(event.newValue));
    }
  };

  addEventListener('storage', listener);

  return () => removeEventListener('storage', listener);
};

// Run a storage write, shrugging off storage that refuses access
// (sandboxed iframes, blocked cookies). Anything else still throws.
const tryStorage = (write: () => void): void => {
  try {
    write();
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== 'SecurityError') {
      throw error;
    }
  }
};

/**
 * `localStorage.setItem`, skipped when storage refuses access.
 *
 * @internal
 */
export const setItem = (key: string, value: string): void =>
  tryStorage(() => localStorage.setItem(key, value));

/**
 * `localStorage.removeItem`, skipped when storage refuses access.
 *
 * @internal
 */
export const removeItem = (key: string): void =>
  tryStorage(() => localStorage.removeItem(key));
