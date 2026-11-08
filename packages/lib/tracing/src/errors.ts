/** Thrown when a span is entered twice. Repeated work needs a new span. */
export class SpanAlreadyEnteredError extends Error {
  override readonly name = 'SpanAlreadyEnteredError';

  constructor(spanName: string) {
    super(`Span "${spanName}" was already entered.`);
  }
}

/** Thrown when a span is exited twice. */
export class SpanAlreadyExitedError extends Error {
  override readonly name = 'SpanAlreadyExitedError';

  constructor(spanName: string) {
    super(`Span "${spanName}" was already exited.`);
  }
}
