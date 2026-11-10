/**
 * Call `listener` whenever the page becomes hidden. A hidden page may never
 * come back (closed, discarded, or killed in the background), so this is the
 * last reliable chance to save state. Returns an unsubscribe function.
 *
 * Does nothing in environments without a document (e.g. workers).
 */
export const onPageHide = (listener: () => void): (() => void) => {
  if (typeof document === 'undefined') return () => {};

  const handler = () => {
    if (document.visibilityState === 'hidden') listener();
  };

  document.addEventListener('visibilitychange', handler);

  return () => document.removeEventListener('visibilitychange', handler);
};
