import { createEffect, onCleanup, type Accessor } from 'solid-js';

/**
 * What a global listener can attach to: the objects a component reaches
 * for when an event has no element to speak of.
 */
export type GlobalListenerTarget = Document | Window;

/**
 * Events both targets share. The narrower of the two event maps, so an
 * event name that typechecks is one either target can raise.
 */
export type GlobalListenerEvents = GlobalEventHandlersEventMap;

/**
 * Listen on `document` or `window` for as long as a condition holds.
 *
 * The target is an accessor returning the target, or `undefined` to
 * listen for nothing: that's the condition. It's read inside an effect,
 * so nothing touches a global until the browser has one — the hook is
 * inert on the server — and the listener is detached the moment the
 * accessor stops naming a target, as well as with the owning scope.
 *
 * The listener itself isn't reactive. It's called as given, so it should
 * read what it needs when it runs rather than close over a stale value.
 *
 * ```ts
 * useGlobalListener(
 *   () => (open() ? document : undefined),
 *   'keydown',
 *   { passive: true },
 *   (event) => {
 *     if (event.key === 'Escape') close();
 *   },
 * );
 * ```
 */
export const useGlobalListener = <Type extends keyof GlobalListenerEvents>(
  target: Accessor<GlobalListenerTarget | undefined>,
  evt: Type,
  opts: AddEventListenerOptions,
  listener: (event: GlobalListenerEvents[Type]) => void,
): void => {
  createEffect(() => {
    const node = target();
    if (node === undefined) return;

    // Widened to `EventListener` for the DOM's signature, and narrowed
    // back on the way in: `evt` is what picked the event type.
    const handle = (event: Event) => {
      listener(event as GlobalListenerEvents[Type]);
    };

    node.addEventListener(evt, handle, opts);
    onCleanup(() => node.removeEventListener(evt, handle, opts));
  });
};
