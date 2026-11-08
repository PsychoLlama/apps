import { createContext, type Context, type TracerConfig } from './config';
import { createSpan, type Span } from './span';

/**
 * The top-level tracing context. Not a span itself: it has no lifecycle,
 * and is where process-wide concerns are configured.
 */
export interface Tracer extends Pick<
  Context,
  'getCurrentTime' | 'getRandomBytes'
> {
  /** Create a span. */
  span: (name: string) => Span;
}

/** Create the top-level {@link Tracer}. Usually called once per realm. */
export const configure = (config: TracerConfig): Tracer => {
  const context = createContext(config);

  return {
    getCurrentTime: context.getCurrentTime,
    getRandomBytes: context.getRandomBytes,
    span: (name) => createSpan(name, context),
  };
};
