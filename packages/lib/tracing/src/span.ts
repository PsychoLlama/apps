import type { Logger } from '@holz/core';

import type { Context } from './config';
import { SpanAlreadyEnteredError, SpanAlreadyExitedError } from './errors';
import type {
  AttributeDraft,
  EnteredSpan,
  ExitedSpan,
  Span,
  SpanStatus,
} from './processor/span-data';

/** Marks a span's work as failed. */
interface SpanFailure {
  /** Why the work failed. */
  error: Error;
}

/** Optional details for a new span. */
export interface SpanOptions {
  /** Key-value details about the span. Not inherited by its children. */
  attrs?: Span['attrs'];
}

/** The API for instrumenting a unit of work. */
export interface SpanHandle {
  /** Logs on behalf of this span. */
  readonly log: Logger;

  /** Create a span nested under this one. */
  child: (name: string, options?: SpanOptions) => SpanHandle;

  /**
   * Change this span's attributes. `edit` receives a copy of the current
   * ones, which becomes the new attributes. Throws once the span has exited.
   */
  updateAttrs: (edit: (attrs: AttributeDraft) => void) => void;

  /**
   * Mark the start of the work this span measures. Returns the function that
   * marks its end. Pass it `{ error }` if the work failed, whether or not
   * anything was thrown. Log errors the work recovered from instead.
   */
  enter: () => (failure?: SpanFailure) => void;
}

/** What a span inherits. Passed from a span to its children. */
export interface SpanContext extends Context, Pick<Span, 'parent' | 'trace'> {}

const getStatus = (failure?: SpanFailure): SpanStatus =>
  failure ? { code: 'error', error: failure.error } : { code: 'ok' };

/** Create a span and announce its data to the processor. */
export const createSpan = (
  name: string,
  context: SpanContext,
  options?: SpanOptions,
): SpanHandle => {
  const span: Span = {
    name,
    id: context.getRandomBytes(8),
    parent: context.parent,
    trace: context.trace,
    attrs: options?.attrs ?? {},
  };

  let state: 'pending' | 'entered' | 'exited' = 'pending';
  let latest: Span | EnteredSpan = span;
  const onAction = context.processor(span);

  return {
    log: context.log,

    child: (childName, childOptions) => {
      const spanContext: SpanContext = {
        ...context,
        parent: {
          id: span.id,
        },
      };

      return createSpan(childName, spanContext, childOptions);
    },

    updateAttrs: (edit) => {
      if (state === 'exited') throw new SpanAlreadyExitedError(name);

      // The clone is what keeps earlier snapshots from changing. The types
      // are only readonly for consumers.
      const attrs = structuredClone(latest.attrs) as AttributeDraft;
      edit(attrs);

      latest = { ...latest, attrs };
      onAction({ type: 'attributes-updated', span: latest });
    },

    enter: () => {
      if (state !== 'pending') throw new SpanAlreadyEnteredError(name);
      state = 'entered';

      const started = context.getCurrentTime();
      const entered: EnteredSpan = {
        ...latest,
        time: {
          started,
        },
      };

      latest = entered;
      onAction({ type: 'enter', span: entered });

      return (failure) => {
        if (state === 'exited') throw new SpanAlreadyExitedError(name);
        state = 'exited';

        const exited: ExitedSpan = {
          ...latest,
          status: getStatus(failure),
          time: {
            started,
            ended: context.getCurrentTime(),
          },
        };

        onAction({ type: 'exit', span: exited });
      };
    },
  };
};
