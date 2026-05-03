import type { JSX } from 'solid-js';

/**
 * Consumer-supplied event handler shape. Accepts the two Solid handler
 * unions we encounter on intrinsic elements:
 * - `JSX.EventHandlerUnion` — most events (click, focus, key, etc.).
 * - `JSX.ChangeEventHandlerUnion` — `onChange` on inputs, narrows
 *   `target` to the input element rather than the more permissive
 *   `Element` the helper accepts.
 *
 * Each is structurally `((event) => void) | [(data, event) => void, data]`;
 * the union here exists so callers don't have to cast through to the
 * helper when forwarding `onChange` from an `<input>`. The helper
 * invokes them identically — the difference is purely typed.
 */
export type ConsumerHandler<El extends Element, E extends Event> =
  | JSX.EventHandlerUnion<El, E>
  | JSX.ChangeEventHandlerUnion<El, E>;

type CallArgs<El extends Element, E extends Event> = E & {
  currentTarget: El;
  target: Element;
};

/**
 * Invokes a consumer-supplied Solid event handler (function or
 * `[fn, data]` bound-handler tuple) before our internal logic runs.
 * Call sites then check `event.defaultPrevented` and bail on true —
 * mirroring Radix's `composeEventHandlers`. This lets a consumer
 * suppress activation/arrow nav/etc. by calling `preventDefault()`.
 * Don't invert the call order or drop the tuple branch.
 */
export const callConsumerHandler = <El extends Element, E extends Event>(
  handler: ConsumerHandler<El, E> | undefined,
  event: CallArgs<El, E>,
): void => {
  if (handler === undefined) return;
  if (typeof handler === 'function') {
    // Cast: `ChangeEventHandler` narrows `event.target` to `El`; the
    // helper signature uses the wider `Element` to share one entry
    // point across event kinds. The runtime always passes the right
    // element — the unsafety is theoretical and contained here so
    // callers don't repeat the cast at every onChange site.
    (handler as (event: CallArgs<El, E>) => void)(event);
    return;
  }
  (handler[0] as (data: unknown, event: CallArgs<El, E>) => void)(
    handler[1],
    event,
  );
};
