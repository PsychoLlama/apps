/**
 * Tooltip component.
 *
 * Ported from Radix UI Themes Tooltip and the Radix UI Primitives Tooltip.
 *
 * API shape — a single `<Tooltip content={…}>` wrapping its trigger, mirroring
 * radix-ui/themes' collapsed wrapper rather than the primitive's
 * Root/Trigger/Content/Arrow compound. A tooltip's content is always a short
 * label, so the compound ceremony buys nothing here. The trigger is the
 * consumer's own element passed as `children`: Solid has no `asChild` prop
 * merging, so we resolve that single child to its DOM node and wire the
 * pointer/focus listeners + anchor positioning onto it directly. That keeps
 * the consumer's interactive element (a `<button>`, `IconButton`, etc.) as the
 * real trigger — no wrapper element, and no invalid button-inside-button that
 * a self-rendering trigger would force.
 *
 * Deviations from Radix:
 * - No `TooltipProvider`. The cross-tooltip "skip delay" window (quickly
 *   moving between triggers opens the next one instantly) lives in a
 *   module-level singleton instead of a context component, so consumers get
 *   the behavior for free without wrapping their app.
 * - Open state is internal by default (hover/focus is ephemeral UI state, not
 *   app data). Pass `open` + `onOpenChange` to control it. No `defaultOpen`.
 * - Content is not hoverable. Radix's default keeps the panel alive while the
 *   pointer crosses a grace-area polygon onto it; we drop that (and the
 *   `disableHoverableContent` prop) — the panel is `pointer-events: none` and
 *   closes when the pointer leaves the trigger. Right for non-interactive
 *   labels, and it sheds the convex-hull pointer tracking.
 * - Accessibility wires `role="tooltip"` + `id` straight onto the visible
 *   panel and `aria-describedby` onto the trigger while open, rather than
 *   Radix's duplicated `VisuallyHidden` copy. Disabled triggers don't emit
 *   pointer/focus events, so they can't surface a tooltip — wrap an enabled
 *   element if you need one.
 * - Positioning is `@floating-ui/dom` directly (the engine Radix Popper wraps):
 *   `offset` + `flip` + `shift` for collision handling, `arrow` for the nub.
 *   Responsive object props and the full Popper surface (sticky, hide,
 *   `avoidCollisions` toggles, arbitrary `collisionBoundary`) are dropped;
 *   `side` and `align` cover the real cases.
 *
 * @see https://www.radix-ui.com/themes/docs/components/tooltip
 * @see https://www.radix-ui.com/primitives/docs/components/tooltip
 */

import {
  children,
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  Show,
  type JSX,
} from 'solid-js';
import { Portal } from 'solid-js/web';
import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  type Placement,
} from '@floating-ui/dom';
import { type TestIdProps } from '../../props/test-id';
import * as css from './tooltip.css';

/** Side of the trigger the panel prefers, before collision flipping. */
export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
/** Alignment of the panel along the chosen side. */
export type TooltipAlign = 'start' | 'center' | 'end';

/** Gap between trigger and panel, in px. Matches Radix's `sideOffset={4}`. */
const SIDE_OFFSET = 4;
/** Viewport inset kept clear during flip/shift. Matches Radix's `collisionPadding={10}`. */
const COLLISION_PADDING = 10;
/** Arrow edge length in px. Mirrors `space[2]` (8px) in `tooltip.css.ts`. */
const ARROW_SIZE_PX = 8;
/** Default hover dwell before a tooltip opens. Radix's `delayDuration`. */
const DEFAULT_DELAY = 700;
/** Window after a close during which the next tooltip opens instantly. */
const SKIP_DELAY = 300;

// --- Cross-tooltip skip-delay singleton (stands in for TooltipProvider) ---

let isOpenDelayed = true;
let skipTimer: ReturnType<typeof setTimeout> | undefined;

/** A tooltip opened: cancel the skip window and arm instant-open. */
const registerOpen = () => {
  clearTimeout(skipTimer);
  isOpenDelayed = false;
};

/** A tooltip closed: after `SKIP_DELAY` of quiet, re-arm the open delay. */
const registerClose = () => {
  clearTimeout(skipTimer);
  skipTimer = setTimeout(() => {
    isOpenDelayed = true;
  }, SKIP_DELAY);
};

const STATIC_SIDE: Record<TooltipSide, TooltipSide> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

/**
 * Add `id` to the trigger's `aria-describedby` token list without disturbing
 * any ids the consumer already set (external descriptions, validation text).
 */
const addDescribedBy = (el: HTMLElement, id: string): void => {
  const existing = el.getAttribute('aria-describedby');
  const ids = existing ? existing.split(/\s+/).filter(Boolean) : [];
  if (!ids.includes(id)) ids.push(id);
  el.setAttribute('aria-describedby', ids.join(' '));
};

/** Remove `id` from the token list, dropping the attribute only when empty. */
const removeDescribedBy = (el: HTMLElement, id: string): void => {
  const existing = el.getAttribute('aria-describedby');
  if (!existing) return;
  const ids = existing.split(/\s+/).filter((token) => token && token !== id);
  if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
  else el.removeAttribute('aria-describedby');
};

/** `Tooltip` props. */
export interface TooltipProps extends TestIdProps {
  /** The label shown in the floating panel. */
  content: JSX.Element;
  /**
   * The trigger. A single element (or component resolving to one); its DOM
   * node becomes the anchor and receives the hover/focus wiring.
   */
  children: JSX.Element;
  /** Controlled open state. Omit to let the tooltip manage its own. */
  open?: boolean;
  /** Fires with the next open state on every hover/focus/dismiss transition. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Milliseconds the pointer must rest on the trigger before opening. Keyboard
   * focus always opens instantly. @default 700
   */
  delayDuration?: number;
  /** Preferred side of the trigger, before collision flipping. @default 'top' */
  side?: TooltipSide;
  /** Alignment along the chosen side. @default 'center' */
  align?: TooltipAlign;
}

/**
 * Floating label that describes its trigger. Opens on hover (after a delay)
 * or keyboard focus, dismisses on leave, blur, Escape, press, or scroll.
 * Wrap the element it annotates:
 *
 * ```tsx
 * <Tooltip content="Copy link">
 *   <IconButton><LinkIcon /></IconButton>
 * </Tooltip>
 * ```
 */
export default function Tooltip(props: TooltipProps): JSX.Element {
  const resolved = children(() => props.children);
  const triggerEl = (): HTMLElement | null => {
    const el = resolved();
    return el instanceof HTMLElement ? el : null;
  };

  const contentId = createUniqueId();
  const [internalOpen, setInternalOpen] = createSignal(false);
  // Tracks whether the current open came from the hover delay (animated) or
  // an instant path (focus / skip-delay) — drives `data-state`.
  const [wasDelayed, setWasDelayed] = createSignal(false);

  const isOpen = (): boolean =>
    props.open !== undefined ? props.open : internalOpen();
  const setOpen = (next: boolean): void => {
    if (props.open === undefined) setInternalOpen(next);
    props.onOpenChange?.(next);
  };

  const delay = (): number => props.delayDuration ?? DEFAULT_DELAY;
  const placement = (): Placement => {
    const side = props.side ?? 'top';
    const align = props.align ?? 'center';
    // In the non-center branch `align` narrows to `'start' | 'end'`, so the
    // template type is a valid `Placement` without an assertion.
    return align === 'center' ? side : `${side}-${align}`;
  };

  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let pointerDown = false;

  const open = (): void => {
    clearTimeout(openTimer);
    openTimer = undefined;
    setWasDelayed(false);
    setOpen(true);
    registerOpen();
  };

  const delayedOpen = (): void => {
    clearTimeout(openTimer);
    openTimer = setTimeout(() => {
      openTimer = undefined;
      setWasDelayed(true);
      setOpen(true);
      registerOpen();
    }, delay());
  };

  const close = (): void => {
    clearTimeout(openTimer);
    openTimer = undefined;
    setOpen(false);
    registerClose();
  };

  // --- Trigger event wiring (imperative; the trigger is consumer-owned) ---

  const onPointerEnter = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return;
    if (isOpenDelayed) delayedOpen();
    else open();
  };
  const onPointerLeave = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return;
    close();
  };
  const onPointerDown = (): void => {
    pointerDown = true;
    document.addEventListener(
      'pointerup',
      () => {
        pointerDown = false;
      },
      { once: true },
    );
    if (isOpen()) close();
  };
  // Keyboard focus opens instantly; a focus that merely follows a press does
  // not (the press already dismissed it).
  const onFocus = (): void => {
    if (!pointerDown) open();
  };
  const onBlur = (): void => close();

  createEffect(() => {
    const el = triggerEl();
    if (!el) return;
    el.addEventListener('pointerenter', onPointerEnter);
    el.addEventListener('pointerleave', onPointerLeave);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('focus', onFocus);
    el.addEventListener('blur', onBlur);
    onCleanup(() => {
      el.removeEventListener('pointerenter', onPointerEnter);
      el.removeEventListener('pointerleave', onPointerLeave);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('focus', onFocus);
      el.removeEventListener('blur', onBlur);
    });
  });

  // Point the trigger at the panel via `aria-describedby` while open. The
  // trigger is consumer-owned, so we append/remove our id rather than writing
  // attributes outright — clobbering its `data-state` (e.g. a wrapped
  // `TabsTrigger`'s active marker) or an existing description would be a
  // regression the consumer can't see coming.
  createEffect(() => {
    const el = triggerEl();
    if (!el || !isOpen()) return;
    addDescribedBy(el, contentId);
    onCleanup(() => removeDescribedBy(el, contentId));
  });

  // Global dismissals while open: Escape, and scrolling any ancestor of the
  // trigger (the panel would otherwise drift away from a control that
  // scrolled out from under it).
  createEffect(() => {
    if (!isOpen()) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') close();
    };
    const onScroll = (event: Event): void => {
      const target = event.target;
      const el = triggerEl();
      if (el && target instanceof Node && target.contains(el)) close();
    };
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { capture: true });
    onCleanup(() => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, { capture: true });
    });
  });

  // --- Floating positioning ---

  const Panel = (): JSX.Element => {
    let panel: HTMLDivElement | undefined;
    let arrowEl: HTMLDivElement | undefined;

    // Refs are assigned during render, so both nodes exist by the time this
    // effect first runs. Tracking `placement()` re-anchors if `side`/`align`
    // change while open.
    createEffect(() => {
      const reference = triggerEl();
      if (!reference || !panel || !arrowEl) return;
      const floating = panel;
      const arrowNode = arrowEl;
      const desired = placement();
      const stop = autoUpdate(reference, floating, () => {
        void computePosition(reference, floating, {
          // Match the panel's `position: fixed`; the default `absolute`
          // strategy returns coordinates that drift on a scrolled page.
          strategy: 'fixed',
          placement: desired,
          middleware: [
            offset(SIDE_OFFSET),
            flip({ padding: COLLISION_PADDING }),
            shift({ padding: COLLISION_PADDING }),
            arrow({ element: arrowNode, padding: ARROW_SIZE_PX }),
          ],
        }).then(({ x, y, placement: finalPlacement, middlewareData }) => {
          floating.style.left = `${x}px`;
          floating.style.top = `${y}px`;
          const side = finalPlacement.split('-')[0] as TooltipSide;
          floating.setAttribute('data-side', side);

          const arrowData = middlewareData.arrow;
          if (arrowData) {
            arrowNode.style.left =
              arrowData.x !== undefined ? `${arrowData.x}px` : '';
            arrowNode.style.top =
              arrowData.y !== undefined ? `${arrowData.y}px` : '';
            // Pull the diamond half-out past the panel edge on the static side.
            arrowNode.style[STATIC_SIDE[side]] = `${-ARROW_SIZE_PX / 2}px`;
          }
        });
      });
      onCleanup(stop);
    });

    return (
      <div
        ref={(el) => (panel = el)}
        role="tooltip"
        id={contentId}
        class={css.content}
        data-state={wasDelayed() ? 'delayed-open' : 'instant-open'}
        data-testid={props.testId}
      >
        {props.content}
        <div
          ref={(el) => (arrowEl = el)}
          class={css.arrow}
          aria-hidden="true"
        />
      </div>
    );
  };

  return (
    <>
      {resolved()}
      <Show when={isOpen()}>
        <Portal>
          <Panel />
        </Portal>
      </Show>
    </>
  );
}
