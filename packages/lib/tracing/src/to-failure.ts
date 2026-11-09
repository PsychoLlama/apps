/** Marks a span's work as failed. */
export interface SpanFailure {
  /** Why the work failed. */
  error: Error;
}

/**
 * An `Error` synthesized from a thrown value that wasn't one. The original
 * value is preserved on `cause`, and the name tells it apart from a genuine
 * `Error`.
 */
export class CoercedError extends Error {
  override readonly name = 'CoercedError';

  constructor(value: unknown) {
    super(String(value), { cause: value });
  }
}

/**
 * Describe a thrown value as a span failure. Existing errors pass through
 * untouched. Anything else is wrapped in a {@link CoercedError}.
 */
export const toFailure = (thrown: unknown): SpanFailure => ({
  error: thrown instanceof Error ? thrown : new CoercedError(thrown),
});
