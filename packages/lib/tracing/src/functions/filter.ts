import type { ActionHandler, SpanProcessor } from '../processor/processor';
import type { Span } from '../processor/span-data';

const ignoreActions: ActionHandler = () => undefined;

/**
 * Only forward spans that pass a test. The test runs once when the span is
 * created, so it sees the span's initial details. A rejected span's children
 * are tested on their own.
 *
 * @param predicate Returns `true` to forward the span.
 * @param processor Where to send the span if it passes the filter.
 */
export const createFilter =
  (
    predicate: (span: Span) => boolean,
    processor: SpanProcessor,
  ): SpanProcessor =>
  (span) =>
    predicate(span) ? processor(span) : ignoreActions;
