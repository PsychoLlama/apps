import { configure, type SpanProcessor, type Tracer } from '@lib/tracing';
import { createDevtoolsBackend } from '@lib/tracing/builtin';
import { processor } from '#processor';

const ignoreSpans: SpanProcessor = () => () => undefined;

/**
 * The tracer for this realm. Start a trace with `tracer.span(name)`. In dev
 * mode, finished spans appear in the browser's performance timeline. `span.log`
 * writes to the same destinations as `createLogger`.
 */
export const tracer: Tracer = configure({
  // Timeline entries are kept until cleared, so they'd pile up in long
  // production sessions.
  processor: import.meta.env.DEV ? createDevtoolsBackend() : ignoreSpans,
  holz: { processor },
});

export type { SpanHandle, SpanOptions, Tracer } from '@lib/tracing';
