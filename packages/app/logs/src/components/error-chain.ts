/** One link in an error's cause chain, flattened to the fields worth showing. */
export interface ErrorFrame {
  /**
   * The error's `name` (`TypeError`, `CoercedError`, …). Read from `name`
   * rather than the constructor: IndexedDB's structured clone collapses every
   * error prototype to plain `Error`, but the `name` string survives intact.
   */
  name: string;
  /** The error's `message`. May be empty. */
  message: string;
}

/**
 * Flatten an error and its `cause` chain into display frames, outermost first.
 * Walks `cause` while it holds an `Error`; a non-`Error` tail (e.g. the raw
 * value a `CoercedError` preserved) becomes a final frame. Guards against a
 * cyclic `cause` so a self-referential chain can't loop forever.
 */
export const errorChain = (error: Error): ErrorFrame[] => {
  const frames: ErrorFrame[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);
    frames.push({ name: current.name, message: current.message });
    current = current.cause;
  }

  if (
    current !== null &&
    current !== undefined &&
    !(current instanceof Error)
  ) {
    frames.push({ name: 'cause', message: formatCause(current) });
  }

  return frames;
};

/** Render a non-`Error` cause tail without leaning on `Object`'s `[object Object]`. */
const formatCause = (value: unknown): string => {
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value) ?? Object.prototype.toString.call(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
};
