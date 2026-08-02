import { createLogger, toError } from '@lib/observability';

/**
 * The ambient host: the clock, the id generator, the clipboard, and the
 * timer. Small things the browser hands out that a saga has no business
 * reaching for directly.
 *
 * They're capabilities rather than bare calls for one reason. Folds are pure
 * and sagas are meant to be replayable under `simulate`, so anything that
 * answers differently on each call has to arrive through `call` — where a
 * test can pin it. That's what keeps a timestamp in a persisted record and
 * one in the store the same number.
 */

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Wall-clock time in epoch milliseconds.
 *
 * Takes no signal — reading a clock is synchronous and has nothing to unwind,
 * and a capability may always declare fewer parameters than it's handed.
 */
export const now = (): number => Date.now();

/**
 * Mint an id for a share. Only ever compared and used as a list key, so
 * anything unique does.
 */
export const newShareId = (): string => crypto.randomUUID();

/**
 * Put text on the clipboard, resolving with whether it worked. The API is
 * permissioned and unavailable outside a secure context, and a refusal is a
 * perfectly ordinary answer — so it's reported rather than thrown, and the
 * caller simply doesn't claim to have copied anything.
 */
export const copyText = async (
  _signal: AbortSignal,
  text: string,
): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    logger.warn('Could not copy to the clipboard.', { error: toError(error) });
    return false;
  }
};

/**
 * Wait, then carry on — the timer behind a confirmation that takes itself
 * away. Rejects if the scope is released first, so the saga unwinds with
 * everything else rather than committing into a torn-down runtime.
 */
export const wait = (
  signal: AbortSignal,
  milliseconds: number,
): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason as Error);
      return;
    }

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abandon);
      resolve();
    }, milliseconds);

    const abandon = () => {
      clearTimeout(timer);
      reject(signal.reason as Error);
    };

    signal.addEventListener('abort', abandon, { once: true });
  });
