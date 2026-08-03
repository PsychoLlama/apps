/**
 * The ambient host: the clock and the id generator. Small things the browser
 * hands out that a saga has no business reaching for directly.
 *
 * They're capabilities rather than bare calls for one reason. Folds are pure
 * and sagas are meant to be replayable under `simulate`, so anything that
 * answers differently on each call has to arrive through `call` — where a
 * test can pin it. That's what keeps a timestamp in a persisted record and
 * one in the store the same number.
 */

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
