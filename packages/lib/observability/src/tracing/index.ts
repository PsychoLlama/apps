import { configure, type Tracer } from '@lib/tracing';
import { createDevtoolsBackend } from '@lib/tracing/builtin';
import { createFilter } from '@lib/tracing/functions';
import { processor } from '#processor';

/**
 * The tracer for this realm. Start a trace with `tracer.span(name)`. In dev
 * mode, finished spans appear in the browser's performance timeline. `span.log`
 * writes to the same destinations as `createLogger`.
 */
export const tracer: Tracer = configure({
  processor: createFilter(() => import.meta.env.DEV, createDevtoolsBackend()),
  holz: { processor },
});

export type { SpanHandle, SpanOptions, Tracer } from '@lib/tracing';
