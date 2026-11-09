import { toError } from '@lib/to-error';

/** Marks a span's work as failed. */
export interface SpanFailure {
  /** Why the work failed. */
  error: Error;
}

/** Describe a thrown value as a span failure. */
export const toFailure = (thrown: unknown): SpanFailure => ({
  error: toError(thrown),
});
