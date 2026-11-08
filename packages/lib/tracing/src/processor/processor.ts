import type { EnteredSpan, ExitedSpan, Span } from './span-data';

/** Something that happened to a span after it was created. */
export type Action =
  { type: 'enter'; span: EnteredSpan } | { type: 'exit'; span: ExitedSpan };

/** Called for every {@link Action} applied to a span. */
export type ActionHandler = (action: Action) => unknown;

/**
 * A tracing plugin. All tracing behavior lives in processors, such as
 * batching, uploading, persisting, and sampling.
 *
 * Called as soon as a span is constructed, which is before the span is
 * entered. Receives plain data only, with no way to alter the span. Returns
 * the handler for that span's actions.
 */
export type TraceProcessor = (span: Span) => ActionHandler;
