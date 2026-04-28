import type { JSX } from 'solid-js';

/**
 * Invokes a consumer-supplied Solid event handler (function or
 * `[fn, data]` bound-handler tuple) before our internal logic runs.
 * Call sites then check `event.defaultPrevented` and bail on true —
 * mirroring Radix's `composeEventHandlers`. This lets a consumer
 * suppress activation/arrow nav/etc. by calling `preventDefault()`.
 * Don't invert the call order or drop the tuple branch.
 */
export const callConsumerHandler = <El extends Element, E extends Event>(
  handler: JSX.EventHandlerUnion<El, E> | undefined,
  event: E & { currentTarget: El; target: Element },
): void => {
  if (handler === undefined) return;
  if (typeof handler === 'function') {
    handler(event);
    return;
  }
  handler[0](handler[1], event);
};
