import { createEffect, onCleanup, type Accessor } from 'solid-js';
import {
  autoUpdate,
  type FloatingElement,
  type ReferenceElement,
} from '@floating-ui/dom';

/**
 * Inputs to {@link useAutoUpdate}.
 *
 * The two elements are accessors rather than elements: a `ref` lands
 * after the first render, and the subject may unmount and remount while
 * the hook stays alive, so the subscription has to wake up when either
 * changes.
 */
export interface AutoUpdateInputs {
  /** The anchor being positioned against. */
  anchor: Accessor<ReferenceElement | undefined>;

  /** The positioned element being kept in place. */
  subject: Accessor<FloatingElement | undefined>;

  /**
   * Recompute the position. Read late on every call, so it never pins a
   * stale closure and never retears the listeners on its own.
   */
  onUpdate: () => void;
}

/**
 * Keep a floating element pinned to its anchor: subscribes to everything
 * that can move the two apart and calls {@link AutoUpdateInputs.onUpdate}
 * when it happens.
 *
 * A thin reactive wrapper over `autoUpdate` from `@floating-ui/dom` with
 * its default triggers: ancestor scroll and resize, element resize, and
 * layout shift. There's no per-frame mode; no ported component exposes
 * one. The subscription is torn down and rebuilt whenever an element
 * changes, and cleaned up with the owning scope. Nothing is subscribed
 * until both elements exist — the hook is safe to call before either ref
 * lands, and it's inert on the server.
 *
 * ```ts
 * useAutoUpdate({
 *   anchor,
 *   subject,
 *   onUpdate: () => void reposition(),
 * });
 * ```
 */
export const useAutoUpdate = (inputs: AutoUpdateInputs): void => {
  createEffect(() => {
    const anchor = inputs.anchor();
    const subject = inputs.subject();

    if (!anchor || !subject) return;

    onCleanup(autoUpdate(anchor, subject, () => inputs.onUpdate()));
  });
};
