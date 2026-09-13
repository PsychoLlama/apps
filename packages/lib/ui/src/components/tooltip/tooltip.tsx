/**
 * Tooltip component.
 *
 * UNDER DEVELOPMENT — DO NOT USE
 *
 * Ported from Radix UI Themes Tooltip, on the internal floating-ui
 * primitive. The first consumer of the tether: the window measures
 * against its trigger and flips or shifts to stay on screen.
 *
 * Deviations from Radix:
 * - One component. Themes' `Tooltip` is already one; here so are the
 *   primitive's `Provider` and `Portal`. There's no portal: the window
 *   renders next to its trigger, inline, so an `overflow` ancestor can
 *   clip it and a later sibling can paint over it. The top layer is a
 *   planned enhancement.
 * - No `open` / `defaultOpen` / `onOpenChange`. The open state is the
 *   trigger's focus and hover, which the stylesheet owns end to end;
 *   there is nothing for a call site to drive.
 * - `display` is required, from the floating root: the wrapper is a
 *   `<span>` or a `<div>`, and only the call site knows which one is
 *   valid where it stands.
 * - `children` is a render function. Upstream merges its handlers and
 *   `aria-describedby` into the child via `asChild`; here the trigger
 *   is handed them as props and spreads them itself, so the tooltip
 *   never inspects or writes to an element it didn't render. A trigger
 *   with a description of its own composes the two — nothing is merged
 *   for it. No `data-state` rides on the trigger.
 * - Hover is CSS too, and so is the decision to ignore a touch. The
 *   root opens while `:hover` under `@media (hover: hover)`, where
 *   upstream reads `pointerType` off each pointer event and turns away
 *   the ones from a touch. The media feature describes the primary
 *   pointer rather than the one in hand, so on a laptop with a
 *   touchscreen a tap is let in; `:hover` sticks after that tap, and
 *   the tooltip stays up until something else is touched.
 * - The delay is CSS as well, and it is not a timer. The window carries
 *   an instant animation whose `animation-delay` is the wait, holding
 *   itself hidden through a `backwards` fill and coming out the other
 *   side. So a visit that ends early leaves nothing behind to cancel, a
 *   pointer that keeps moving over the trigger can't re-arm anything,
 *   and the wait happens before hydration the same as after. Upstream
 *   runs a timer per tooltip and a shared one per page.
 * - The wait is fixed at 200ms, upstream's default. No `delayDuration`
 *   prop, on the same grounds as the collision settings: the number is
 *   a property of the page's feel, not of one call site.
 * - Focus never waits, and focus arriving on a trigger the pointer is
 *   already resting on doesn't race the wait — it shortens it to
 *   nothing, and the window shows from wherever the wait had got to.
 * - Hoverable content arrives early and half-finished. The window sits
 *   inside the root, so hovering the tooltip itself keeps the root
 *   hovered and the tooltip open, which is what upstream's
 *   `disableHoverableContent={false}` buys. What's missing is the
 *   grace area over the gap between trigger and window: the pointer
 *   crossing it leaves the root for a moment and the tooltip closes
 *   under it. There's no `disableHoverableContent` prop yet either.
 * - Focus is CSS. Upstream opens from a `focus` handler unless a
 *   pointer press caused the focus, tracked in a ref. Here the window
 *   shows while the root `:has(:focus-visible)`, and the browser's own
 *   heuristic makes the press call. The two differ at the edges:
 *   programmatic `.focus()` after a pointer interaction doesn't show
 *   (upstream would); a pointer press into a text-input trigger does
 *   (upstream wouldn't); and a keypress on a pointer-focused trigger
 *   shows it (upstream waits for a refocus). No `focus` handlers, no
 *   open signal, no attribute written on the way in or out.
 * - `content` renders once. Upstream renders it twice — visibly, and
 *   again in a visually-hidden `role="tooltip"` copy the trigger is
 *   described by — so its content can be anything and its `aria-label`
 *   can override the copy alone. Here the visible text is the tooltip:
 *   it carries the role, the id, and the label, and the description
 *   computes the same (`aria-label` first, else the text).
 * - Collision handling is fixed at Themes' values (`collisionPadding`
 *   10, `sticky="partial"`, collisions avoided) and not exposed. Nor
 *   are `arrowPadding`, `collisionBoundary`, `hideWhenDetached`,
 *   `forceMount`, `container`, `width`, or `minWidth`.
 * - The window is always in the DOM. Upstream mounts its content on open
 *   and unmounts it on close; here it renders once, CSS-placed, and
 *   the stylesheet decides whether it shows. No `data-state` rides on
 *   the window either: nothing reads one, and the state it would name
 *   lives in the stylesheet's selector.
 * - The tether follows the stylesheet. While the stylesheet considers
 *   the tooltip open it gives the root an empty, paused animation; its
 *   `animationstart` and `animationcancel` are the stylesheet saying
 *   so, and the tether engages between the two. That includes the wait
 *   before a hovered tooltip appears, on purpose: the window is
 *   measured and placed while it's still hidden, so it doesn't turn up
 *   in the wrong spot and jump. A closed tooltip costs no measurement
 *   and no scroll listener. Upstream's tether runs for as long as the
 *   content is mounted, which is the same span.
 * - `aria-describedby` is static. Upstream sets it only while open,
 *   because a closed tooltip is unmounted and the id would dangle. Here
 *   the tooltip is always in the DOM, and the accessible description
 *   reads a referenced node even when it's hidden, so the trigger is
 *   described at all times: a screen reader browsing by virtual cursor
 *   or touch, which never focuses the trigger, still gets the text, and
 *   focus can't race the attribute.
 * - Dismissal is a veto, not a close. Escape, a press outside the
 *   window, a click on the trigger, or a scroll that moves it all mark
 *   the window `data-dismissed`, which hides it while the stylesheet
 *   still wants it open; the veto lifts when the stylesheet stops
 *   wanting that, i.e. when focus and the pointer have both left. That
 *   the veto can hide the window outright, rather than tiptoeing around
 *   its own open signal, is why the signal sits on the root. Upstream
 *   closes and reopens on the next focus, which comes to the same
 *   thing. Its guard against the focus a press brings reopening the
 *   tooltip (a flag held until the next `pointerup`) has no counterpart
 *   here: `:focus-visible` already declines that focus.
 * - Dismissing on a press is mostly redundant and kept anyway. A press
 *   blurs the trigger, which closes the tooltip on its own; what it
 *   covers is the press that holds focus by preventing the default,
 *   and the right-click that never moves focus at all.
 * - The click that dismisses is any click inside the floating root and
 *   outside the window, which is the trigger without the tooltip
 *   having to know which element that is. It's heard on the root, the
 *   one element the tooltip renders around both.
 * - Every document and window listener is passive, and attached only
 *   while the tooltip is open. A page of closed tooltips listens for
 *   nothing.
 * - Page-wide coordination is still to come: every tooltip opens on
 *   its own, so two can be up at once, and every one of them makes you
 *   wait the full 200ms however recently the last one was up. No
 *   `skipDelayDuration`; that arrives with the coordination it belongs
 *   to, as a value written over the delay the stylesheet already has.
 *
 * @see https://www.radix-ui.com/themes/docs/components/tooltip
 */

import {
  createSignal,
  createUniqueId,
  mergeProps,
  splitProps,
  type JSX,
} from 'solid-js';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { flip, limitShift, shift } from '@floating-ui/dom';
import clx from '@lib/classnames';
import {
  FloatingBody,
  FloatingRoot,
  FloatingWindow,
  type FloatingAlignment,
  type FloatingRootDisplay,
  type FloatingSide,
  type FloatingTether,
} from '../_internal/floating-ui';
import Text from '../text/text';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import { useGlobalListener } from './use-global-listener';
import * as css from './tooltip.css';

/** Edge of the trigger the tooltip binds to. */
export type TooltipSide = FloatingSide;

/** Placement along that edge. */
export type TooltipAlign = FloatingAlignment;

/** How the wrapper around the trigger sits in the surrounding flow. */
export type TooltipDisplay = FloatingRootDisplay;

/**
 * What the tooltip hands its trigger. Spread onto the focusable element
 * as-is: the description names the tooltip. A trigger with a
 * description of its own composes the two. Showing and hiding is the
 * stylesheet's, off the trigger's focus and hover, so there are no
 * handlers.
 */
export interface TooltipTriggerProps {
  /** Id of the tooltip. Set whether or not it's open. */
  readonly 'aria-describedby': string;
}

/**
 * `Tooltip` props. Wraps its trigger and floats a short label next to
 * it on focus.
 */
export interface TooltipProps
  extends
    RequiredTestIdProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, 'role' | 'style' | 'children'> {
  /**
   * How the wrapper around the trigger sits in the surrounding flow:
   * `inline` renders a `<span>`, `block` a `<div>`. Required — the
   * wrong one is invalid markup inside a paragraph or a stray baseline
   * gap under a layout box, and the component can't tell which it's
   * in.
   */
  display: TooltipDisplay;

  /** The label to float. Short, plain, and not interactive. */
  content: JSX.Element;

  /**
   * What assistive tech reads in place of {@link content}, for a label
   * whose visible form doesn't read well aloud.
   */
  'aria-label'?: string;

  /** Edge of the trigger the tooltip binds to. @default 'top' */
  side?: TooltipSide;

  /** Placement along that edge. @default 'center' */
  align?: TooltipAlign;

  /** Gap between the trigger and the arrow's tip, in px. @default 4 */
  sideOffset?: number;

  /**
   * Nudge along the bound edge, in px. Ignored when centered.
   * @default 0
   */
  alignOffset?: number;

  /** Any CSS width the surface wraps at. @default '360px' */
  maxWidth?: string;

  /** Class merged onto the surface. */
  class?: string;

  /**
   * Renders the trigger: a single focusable element, such as a button
   * or a link, with the given props spread onto it.
   */
  children: (trigger: TooltipTriggerProps) => JSX.Element;
}

/** Themes' collision settings, resolved once for every tooltip. */
const TETHER: FloatingTether = {
  middleware: [
    shift({ padding: 10, limiter: limitShift() }),
    flip({ padding: 10 }),
  ],
};

/** The props every tooltip fills in unless told otherwise. */
const DEFAULTS = {
  side: 'top',
  align: 'center',
  sideOffset: 4,
  alignOffset: 0,
} satisfies Partial<TooltipProps>;

/** Listener options for everything the tooltip attaches outside itself. */
const PASSIVE: AddEventListenerOptions = { passive: true };

/**
 * Scroll doesn't bubble, so it's heard on the way down instead. Any
 * element can scroll, and the one that matters is an ancestor.
 */
const PASSIVE_CAPTURE: AddEventListenerOptions = {
  passive: true,
  capture: true,
};

/**
 * A short label that floats beside its trigger while keyboard focus or
 * the pointer rests on it, until Escape, a press, or a scroll dismisses
 * it. Announced to assistive tech as the trigger's description, open or
 * not.
 */
const Tooltip = (rawProps: TooltipProps) => {
  const props = mergeProps(DEFAULTS, rawProps);
  const [tid, withoutTid] = splitProps(props, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'display',
    'content',
    'aria-label',
    'side',
    'align',
    'sideOffset',
    'alignOffset',
    'maxWidth',
    'class',
    'children',
  ]);

  const contentId = createUniqueId();
  const triggerProps: TooltipTriggerProps = { 'aria-describedby': contentId };

  // Whether the stylesheet considers the tooltip open, as the root
  // reports it (see `css.root`). The tether rides on this, so a closed
  // window is never measured and a page of closed tooltips isn't
  // listening for anything.
  const [open, setOpen] = createSignal(false);

  // The component's veto on an open window (see `css.window`). Lifted
  // when the stylesheet stops wanting the window open, so a dismissed
  // tooltip comes back on the next focus, not before.
  const [dismissed, setDismissed] = createSignal(false);

  // Heard on the root, so any animation inside it arrives here too —
  // the trigger's, and later the window's own entrance. Only the open
  // signal is ours to read.
  const onOpenChange = (event: AnimationEvent) => {
    if (event.animationName !== css.open) return;

    const opening = event.type === 'animationstart';
    setOpen(opening);

    if (!opening) setDismissed(false);
  };

  // What the dismissals measure against. The tooltip inspects only what
  // it rendered: the root, holding the trigger and the window, and the
  // window itself.
  let root: HTMLElement | undefined;
  let subject: HTMLDivElement | undefined;

  const outsideWindow = (event: Event) =>
    !(event.target instanceof Node && subject?.contains(event.target));

  const scrollsRoot = (event: Event) =>
    root !== undefined &&
    event.target instanceof Node &&
    event.target.contains(root);

  // Listened for only while open and not yet dismissed, so a page of
  // closed tooltips listens for nothing.
  const listening = () => (open() && !dismissed() ? document : undefined);

  // Escape has no target to speak of: it's aimed at whatever is on
  // screen, and the tooltip is.
  useGlobalListener(listening, 'keydown', PASSIVE, (event) => {
    if (event.key === 'Escape') setDismissed(true);
  });

  // A press anywhere but the tooltip itself. Most of these would close
  // it anyway by blurring the trigger; this one also covers the presses
  // that hold focus by preventing the default, and lands before the
  // blur either way.
  useGlobalListener(listening, 'pointerdown', PASSIVE, (event) => {
    if (outsideWindow(event)) setDismissed(true);
  });

  // Anything scrolling the trigger out from under its window. Heard on
  // `window`, which sees the capture phase for every scroller on the
  // page.
  useGlobalListener(
    () => (open() && !dismissed() ? window : undefined),
    'scroll',
    PASSIVE_CAPTURE,
    (event) => {
      if (scrollsRoot(event)) setDismissed(true);
    },
  );

  // A click inside the root but outside the window is a click on the
  // trigger. A pointer's was preceded by a press that already
  // dismissed, so this is for the keyboard's: Enter and Space arrive as
  // a click on the focused element.
  const onRootClick = (event: MouseEvent) => {
    if (open() && outsideWindow(event)) setDismissed(true);
  };

  return (
    <FloatingRoot
      display={local.display}
      class={css.root}
      onClick={onRootClick}
      onAnimationStart={onOpenChange}
      onAnimationCancel={onOpenChange}
      ref={(ref) => {
        root = ref;
      }}
    >
      {local.children(triggerProps)}

      <FloatingWindow
        data-dismissed={dismissed() ? '' : undefined}
        side={local.side}
        align={local.align}
        sideOffset={local.sideOffset}
        alignOffset={local.alignOffset}
        radius={2}
        arrow={{}}
        class={css.window}
        testId={tid.testId}
        tether={open() && !dismissed() ? TETHER : undefined}
        ref={(ref) => {
          subject = ref;
        }}
      >
        <FloatingBody
          {...rest}
          testId={`${tid.testId}-surface`}
          py={1}
          px={2}
          class={clx(css.content, local.class)}
          style={assignInlineVars({
            ...(local.maxWidth !== undefined && {
              [css.maxWidth]: local.maxWidth,
            }),
          })}
        >
          <Text
            as="p"
            role="tooltip"
            id={contentId}
            aria-label={local['aria-label']}
            testId={`${tid.testId}-text`}
            size={1}
            selectable={false}
            class={css.text}
          >
            {local.content}
          </Text>
        </FloatingBody>
      </FloatingWindow>
    </FloatingRoot>
  );
};

export default Tooltip;
