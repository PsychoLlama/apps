/**
 * Normalize an unknown thrown value to an `Error`. A `catch` binding is
 * typed `unknown` because anything can be thrown — pass it through here
 * before handing it to a logger's `error` field (or any API that wants a
 * real `Error`). Existing errors pass through untouched; everything else
 * is wrapped with its `String(...)` form as the message.
 */
export const toError = (thrown: unknown): Error =>
  thrown instanceof Error ? thrown : new Error(String(thrown));
