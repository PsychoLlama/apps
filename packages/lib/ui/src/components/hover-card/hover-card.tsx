/**
 * HoverCard component.
 *
 * Ported from Radix UI Themes HoverCard, on the internal floating-ui
 * primitive. A card of supplementary content that floats beside its
 * trigger while the pointer or keyboard focus rests there.
 *
 * Deviations from Radix:
 * - One component. Upstream's `Root` / `Trigger` / `Portal` / `Content`
 *   collapse into `HoverCard`: the trigger is the render function's
 *   element and the content is a prop.
 * - No portal. The window renders next to its trigger, inline, so an
 *   `overflow` ancestor can clip it and a later sibling can paint over
 *   it. Same trade as `Tooltip` and `Popover`.
 * - No `open` / `defaultOpen` / `onOpenChange`. Opening and closing
 *   are the card's own business, as on `Tooltip`; there's nothing for a
 *   call site to drive.
 * - `openDelay` / `closeDelay` are fixed at Themes' 200ms / 150ms and
 *   not exposed: they're a property of the page's feel, not one call
 *   site. They're timers rather than motion tokens, so reduced motion
 *   keeps them.
 * - `display` is required, from the floating root, as on `Tooltip`. An
 *   inline card's content must be phrasing content.
 * - `children` is a render function. Upstream merges its handlers and
 *   `data-state` into the child via `asChild`; here the trigger is
 *   handed `aria-details` and spreads it itself. The handlers live on
 *   the floating root instead, which holds both trigger and card, so
 *   entering either counts once and no handler is merged.
 * - The window is always in the DOM, hidden at rest. Upstream mounts
 *   its content on open. The tether only runs while the card is on
 *   screen, exit included, so a closed card costs no measurement.
 * - Hover is the root's `pointerenter` / `pointerleave` with touch
 *   ignored, matching upstream's `excludeTouch`. Upstream also cancels
 *   `touchstart` on the trigger to keep a tap from focusing it; here
 *   that focus isn't `:focus-visible`, so it opens nothing.
 * - Focus only counts when it's `:focus-visible`, and anywhere inside
 *   the root, the card included. Upstream opens on any focus of the
 *   trigger, so a pointer press focusing it opens it too, and focus
 *   moving into the card closes it.
 * - The card is reachable by keyboard. Upstream sets `tabindex=-1` on
 *   every tabbable inside it, leaving it to sighted pointer users; here
 *   Tab walks from the trigger into the card, and focus there holds it
 *   open.
 * - `aria-details` points the trigger at the card while it's on
 *   screen. Upstream sets no ARIA at all. Nothing else describes it
 *   honestly: `aria-describedby` would flatten the card into a string,
 *   and `aria-haspopup` / `aria-expanded` promise that activating the
 *   trigger toggles something.
 * - A selection holds the card open only while it reaches into the
 *   card, tracked through `selectionchange`, keyboard selection
 *   included. Upstream sets a flag on `pointerup` when the page has any
 *   selection, and keeps it until the next press inside the card.
 * - No selection containment. Upstream swaps `user-select` on the body
 *   while a press inside the card is held, so a drag can't select past
 *   its edge. Not left out for a reason: it didn't make a strong enough
 *   case in the first implementation, and drags looked fine without it.
 * - Dismissal isn't configurable: Escape and a press outside always
 *   close, with no `onEscapeKeyDown`, `onPointerDownOutside`,
 *   `onFocusOutside`, or `onInteractOutside`. Focus moving outside
 *   doesn't dismiss, as upstream; it counts as leaving, with the delay.
 * - Collision handling is fixed at Themes' values (`collisionPadding`
 *   10, `sticky="partial"`, collisions avoided) and not exposed. Nor
 *   are `arrowPadding`, `collisionBoundary`, `hideWhenDetached`,
 *   `forceMount`, or `container`. No arrow, as Themes.
 * - `size` is a plain scale, not a responsive object.
 * - `width`, `minWidth`, and the height props aren't exposed;
 *   `maxWidth` is.
 * - Deferred: `highContrast` styling.
 *
 * @see https://www.radix-ui.com/themes/docs/components/hover-card
 * @see https://www.radix-ui.com/primitives/docs/components/hover-card
 */

import {
  createEffect,
  createSignal,
  createUniqueId,
  mergeProps,
  on,
  onCleanup,
  splitProps,
  type JSX,
} from 'solid-js';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { flip, limitShift, shift } from '@floating-ui/dom';
import clx from '@lib/classnames';
import type { RadiusScale, SpaceScale } from '@lib/design';
import {
  FloatingBody,
  FloatingRoot,
  FloatingWindow,
  type FloatingAlignment,
  type FloatingElement,
  type FloatingRootDisplay,
  type FloatingSide,
  type FloatingTether,
} from '../_internal/floating-ui';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import { useDismissal } from '../_internal/use-dismissal';
import { useGlobalListener } from '../_internal/use-global-listener';
import { createVisibility } from '../_internal/visibility';
import * as motion from '../_internal/window-motion.css';
import * as css from './hover-card.css';

/** Edge of the trigger the card binds to. */
export type HoverCardSide = FloatingSide;

/** Placement along that edge. */
export type HoverCardAlign = FloatingAlignment;

/** How the wrapper around the trigger sits in the surrounding flow. */
export type HoverCardDisplay = FloatingRootDisplay;

/** Surface padding and rounding on a 1–3 scale. */
export type HoverCardSize = 1 | 2 | 3;

/**
 * What the hover card hands its trigger. Spread onto the focusable
 * element as-is.
 */
export interface HoverCardTriggerProps {
  /**
   * Id of the card while it's on screen, pointing assistive tech at the
   * richer content it holds. Absent while hidden, when there'd be
   * nothing to go to.
   */
  readonly 'aria-details': string | undefined;
}

/**
 * `HoverCard` props. Wraps its trigger and floats a card of content next
 * to it while the pointer or keyboard focus rests on either.
 */
export interface HoverCardProps
  extends
    RequiredTestIdProps,
    Omit<
      JSX.HTMLAttributes<FloatingElement>,
      'role' | 'style' | 'children' | 'content'
    > {
  /**
   * How the wrapper around the trigger sits in the surrounding flow:
   * `inline` renders it and the card as `<span>`s, `block` as a `<div>`
   * and block elements. Required — the wrong one is invalid markup
   * inside a paragraph or a stray baseline gap under a layout box, and
   * the component can't tell which it's in.
   */
  display: HoverCardDisplay;

  /**
   * The card to float. Supplementary: everything in it should be
   * reachable some other way, usually through the trigger itself.
   */
  content: JSX.Element;

  /** Edge of the trigger the card binds to. @default 'bottom' */
  side?: HoverCardSide;

  /** Placement along that edge. @default 'start' */
  align?: HoverCardAlign;

  /** Gap between the trigger and the surface, in px. @default 8 */
  sideOffset?: number;

  /**
   * Nudge along the bound edge, in px. Ignored when centered.
   * @default 0
   */
  alignOffset?: number;

  /** Surface padding and rounding on a 1–3 scale. @default 2 */
  size?: HoverCardSize;

  /** Any CSS width the surface wraps at. @default '480px' */
  maxWidth?: string;

  /** Class merged onto the surface. */
  class?: string;

  /**
   * Renders the trigger: a single focusable element, usually a link,
   * with the given props spread onto it.
   */
  children: (trigger: HoverCardTriggerProps) => JSX.Element;
}

/** The props every hover card fills in unless told otherwise. */
const DEFAULTS = {
  side: 'bottom',
  align: 'start',
  sideOffset: 8,
  alignOffset: 0,
  size: 2,
} satisfies Partial<HoverCardProps>;

/** Themes' padding and radius for each size. */
const SURFACE_BY_SIZE: Record<
  HoverCardSize,
  { padding: SpaceScale; radius: RadiusScale }
> = {
  1: { padding: 3, radius: 4 },
  2: { padding: 4, radius: 4 },
  3: { padding: 5, radius: 5 },
};

// Themes' delays. Waiting isn't motion, so these stay put under reduced
// motion rather than collapsing with the duration tokens.
const OPEN_DELAY = 200;
const CLOSE_DELAY = 150;

/** Listener options for the document-wide events the card hears. */
const PASSIVE: AddEventListenerOptions = { passive: true };

/** Whether the page's selection reaches into the element at all. */
const selectionWithin = (element: HTMLElement | undefined) => {
  const selection = document.getSelection();

  return (
    element !== undefined &&
    selection !== null &&
    !selection.isCollapsed &&
    selection.containsNode(element, true)
  );
};

/** Themes' collision settings, resolved once for every hover card. */
const TETHER: FloatingTether = {
  middleware: [
    shift({ padding: css.COLLISION_PADDING, limiter: limitShift() }),
    flip({ padding: css.COLLISION_PADDING }),
  ],
};

/**
 * A card of supplementary content that floats beside its trigger while
 * the pointer or keyboard focus rests on the trigger or the card.
 */
const HoverCard = (rawProps: HoverCardProps) => {
  const props = mergeProps(DEFAULTS, rawProps);
  const [tid, withoutTid] = splitProps(props, testIdPropKeys);
  const [local, rest] = splitProps(withoutTid, [
    'display',
    'content',
    'side',
    'align',
    'sideOffset',
    'alignOffset',
    'size',
    'maxWidth',
    'class',
    'children',
  ]);

  const [open, setOpen] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);
  const [focused, setFocused] = createSignal(false);
  const [pressed, setPressed] = createSignal(false);
  const [selected, setSelected] = createSignal(false);
  const [root, setRoot] = createSignal<HTMLElement>();
  const [windowElement, setWindowElement] = createSignal<HTMLElement>();
  const [surfaceElement, setSurfaceElement] = createSignal<HTMLElement>();

  // The window stays mounted; this says when it's on screen, exit
  // included, which is as long as the tether has anything to do.
  const visibility = createVisibility({ open, element: windowElement });
  const surface = () => SURFACE_BY_SIZE[local.size];
  const contentId = createUniqueId();

  const triggerProps: HoverCardTriggerProps = {
    get 'aria-details'() {
      return visibility.visible() ? contentId : undefined;
    },
  };

  // Anything holding the card up. Settling on a change waits out the
  // delay, and a change back before then cancels it — which is what
  // carries the pointer across the gap between trigger and card. A
  // press on the card, or a selection reaching into it, holds it up
  // while the pointer wanders off to finish the drag or copy the text.
  const wanted = () => hovered() || focused() || pressed() || selected();
  let timer: ReturnType<typeof setTimeout> | undefined;

  createEffect(
    on(
      wanted,
      (wanted) => {
        clearTimeout(timer);
        if (wanted === open()) return;

        timer = setTimeout(
          () => setOpen(wanted),
          wanted ? OPEN_DELAY : CLOSE_DELAY,
        );
      },
      { defer: true },
    ),
  );

  onCleanup(() => clearTimeout(timer));

  // Closes on the spot, no delay, and stays closed while whatever held
  // it up still does: the next visit is what reopens it. Focus moving
  // outside isn't one of these — the pointer may still be resting on
  // the card, and losing focus already counts as leaving.
  useDismissal({
    open,
    root,
    focusOutside: false,
    dismiss: () => {
      clearTimeout(timer);
      setPressed(false);
      setSelected(false);
      setOpen(false);
    },
  });

  // A press anywhere lets go of the card, even off the page's edge.
  const release = () => setPressed(false);
  const whilePressed = () => (pressed() ? document : undefined);
  useGlobalListener(whilePressed, 'pointerup', PASSIVE, release);
  useGlobalListener(whilePressed, 'pointercancel', PASSIVE, release);

  // Only an open card cares where the selection is.
  useGlobalListener(
    () => (open() ? document : undefined),
    'selectionchange',
    PASSIVE,
    () => setSelected(selectionWithin(surfaceElement())),
  );

  // The root holds the trigger and the card, so entering either is
  // entering it. A touch has no hover to rest with; it's left out.
  const onPointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') setHovered(true);
  };

  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') setHovered(false);
  };

  // Keyboard focus anywhere inside counts, so Tab can walk from the
  // trigger into the card. Focus a press put there doesn't; it would
  // hold the card up after the pointer had left.
  const onFocusIn = (event: FocusEvent) => {
    setFocused(
      event.target instanceof Element && event.target.matches(':focus-visible'),
    );
  };

  const onFocusOut = (event: FocusEvent) => {
    const root = event.currentTarget as HTMLElement;
    const next = event.relatedTarget;

    // Moving within the root, `focusin` follows with the new target.
    if (!(next instanceof Node && root.contains(next))) setFocused(false);
  };

  return (
    <FloatingRoot
      ref={setRoot}
      display={local.display}
      class={css.root}
      style={assignInlineVars({
        ...(local.maxWidth !== undefined && {
          [css.maxWidth]: local.maxWidth,
        }),
      })}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocusIn={onFocusIn}
      onFocusOut={onFocusOut}
    >
      {local.children(triggerProps)}

      <FloatingWindow
        {...visibility.props}
        ref={setWindowElement}
        class={clx(motion.window, css.window)}
        onPointerDown={() => setPressed(true)}
        side={local.side}
        align={local.align}
        sideOffset={local.sideOffset}
        alignOffset={local.alignOffset}
        radius={surface().radius}
        tether={visibility.visible() ? TETHER : undefined}
        testId={tid.testId}
      >
        <FloatingBody
          {...rest}
          ref={setSurfaceElement}
          id={contentId}
          p={surface().padding}
          class={clx(css.content, local.class)}
          testId={`${tid.testId}-surface`}
        >
          {local.content}
        </FloatingBody>
      </FloatingWindow>
    </FloatingRoot>
  );
};

export default HoverCard;
