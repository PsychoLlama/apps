import { createContext, type TracerConfig } from './config';
import { createSpan, type SpanHandle } from './span';

/**
 * The top-level tracing context. Not a span itself: it has no lifecycle,
 * and is where process-wide concerns are configured.
 */
export interface Tracer {
  /** Create a span. */
  span: (name: string) => SpanHandle;
}

/** Create the top-level {@link Tracer}. Usually called once per realm. */
export const configure = (config: TracerConfig): Tracer => {
  const context = createContext(config);

  return {
    span: (name) => {
      return createSpan(name, {
        ...context,
        parent: null,
        trace: {
          id: context.getRandomBytes(16),
        },
      });
    },
  };
};
