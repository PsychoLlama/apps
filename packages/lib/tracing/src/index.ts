export type { TracerConfig } from './config';
export { SpanAlreadyEnteredError, SpanAlreadyExitedError } from './errors';
export type {
  Action,
  ActionHandler,
  SpanProcessor,
} from './processor/processor';
export type {
  AttributeDraft,
  EnteredSpan,
  ExitedSpan,
  Span,
  SpanStatus,
} from './processor/span-data';
export type { SpanHandle, SpanOptions } from './span';
export { configure, type Tracer } from './tracer';
