/**
 * Raised when in-flight saga work is cancelled rather than failed — a scope
 * losing its last anchor, or a sibling erroring inside `all`/`atomic`.
 * Callers awaiting `run(...)` can tell teardown from a real fault with
 * `instanceof`.
 */
export class AbortError extends Error {
  constructor(message = 'In-flight work was cancelled') {
    super(message);
    this.name = 'AbortError';
  }
}
