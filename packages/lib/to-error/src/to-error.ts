/**
 * An `Error` synthesized from a thrown value that wasn't one. {@link toError}
 * produces this whenever it has to upgrade a non-`Error` throw (a string, a
 * plain object, `undefined`) so the value still reads cleanly downstream.
 *
 * The original thrown value is preserved on `cause`, and the `CoercedError`
 * name marks it as a synthetic upgrade — letting log readers (and any
 * `instanceof` check) tell a genuine `Error` from one we manufactured.
 */
export class CoercedError extends Error {
  constructor(value: unknown) {
    super(String(value), { cause: value });
    this.name = 'CoercedError';
  }
}

/**
 * Normalize an unknown thrown value to an `Error`. A `catch` binding is
 * typed `unknown` because anything can be thrown — pass it through here
 * before handing it to a logger's `error` field (or any API that wants a
 * real `Error`). Existing errors pass through untouched; everything else is
 * wrapped in a {@link CoercedError} that flags the upgrade and keeps the
 * original value on `cause`.
 */
export const toError = (thrown: unknown): Error =>
  thrown instanceof Error ? thrown : new CoercedError(thrown);
