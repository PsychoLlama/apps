export type { TracerConfig } from './config';
export { SpanAlreadyEnteredError, SpanAlreadyExitedError } from './errors';
export type {
  Action,
  ActionHandler,
  TraceProcessor,
} from './processor/processor';
export type {
  EnteredSpan,
  ExitedSpan,
  Span,
  SpanStatus,
} from './processor/span-data';
export type { SpanHandle } from './span';
export { configure, type Tracer } from './tracer';
