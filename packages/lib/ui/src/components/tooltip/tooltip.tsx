/**
 * Tooltip component.
 *
 * Ported from Radix UI Themes Tooltip, on the internal floating-ui
 * primitive. The first consumer of the tether: the window measures
 * against its trigger and flips or shifts to stay on screen.
 *
 * Deviations from Radix:
 * - One component. Themes' `Tooltip` is already one; here so are the
 *   primitive's `Provider` and `Portal`. There's no portal: the window
 *   renders next to its trigger, inline, so an `overflow` ancestor can
 *   clip it and a later sibling can paint over it.
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
 *   one animation whose `animation-delay` is the wait: a `backwards`
 *   fill holds it hidden until the delay is up, and what runs after is
 *   the entrance. So a visit that ends early leaves nothing behind to
 *   cancel, a pointer that keeps moving over the trigger can't re-arm
 *   anything, and the wait happens before hydration the same as after.
 *   Upstream runs a timer per tooltip and a shared one per page.
 * - The wait is fixed at 200ms, upstream's default. No `delayDuration`
 *   prop, on the same grounds as the collision settings: the number is
 *   a property of the page's feel, not of one call site.
 * - Focus never waits, and focus arriving on a trigger the pointer is
 *   already resting on doesn't race the wait — it shortens it to
 *   nothing, and the window shows from wherever the wait had got to.
 * - Only a hovered tooltip animates in — a slide and fade out of the
 *   trigger's edge — and nothing animates out. Upstream agrees on both
 *   counts but arrives at the first differently: it hangs the entrance
 *   on `data-state="delayed-open"`, where here the entrance lasts as
 *   long as the wait warranted. One variable sets both, so an open that
 *   didn't wait doesn't animate, and when the skip delay drops the
 *   wait, the entrance goes with it the way upstream's `instant-open`
 *   does. Focus landing mid-entrance ends it on the spot, for the same
 *   reason it ends the wait.
 * - Hoverable content is the default and comes for free: the window
 *   sits inside the root, so resting on the tooltip keeps the root
 *   hovered and the tooltip open, which is what upstream's
 *   `disableHoverableContent={false}` buys. The gap between trigger and
 *   window is bridged by a grace area, a pseudo-element of the window,
 *   where upstream tracks the pointer's exit and builds a polygon from
 *   it in JS. Ours is a standing trapezoid, the arrow's row plus the
 *   gap, narrowing onto the pointer from the far end's full width: the
 *   window's on the way over, the trigger's on the way back. It's tuned
 *   as the pointer moves rather than built when it leaves, which is
 *   what it takes for a strip that has to be right before the crossing
 *   starts. Four things still differ: the end at the pointer is the
 *   arrow's base wide where upstream's is a point; on the way back it's
 *   wider still — the trigger's width, within the arrow's base and the
 *   window's — so leaving from the window's corner for a small trigger
 *   is a band the trigger's width rather than a sliver, which is more
 *   forgiving than upstream's hull; it's centered on the pointer's last
 *   move over the surface rather than the point it left from, so a fast
 *   exit angled off to one side can cross the edge outside it and close
 *   the tooltip where upstream's would hold; and with no pointer yet
 *   seen it falls back to the arrow's seat, aligned or measured.
 * - The grace area doesn't take the pointer until the window has
 *   finished arriving. It's part of the window, so the entrance carries
 *   it over the trigger's edge, where it would swallow the press it's
 *   sitting on. Upstream has no such window — its grace area is built
 *   on the way out, from wherever the pointer left — so a pointer that
 *   leaves the trigger during our entrance finds nothing to cross and
 *   the tooltip closes, where upstream's would hold.
 * - The grace area is told which path it has to serve, as `data-path`
 *   on the window: `initial` until a pointer turns up on the trigger,
 *   `enter` from then until it reaches the window, `leave` once it has
 *   and the only path left is the way back, then `enter` again for the
 *   next visit. `initial` is therefore the unenhanced strip — what the
 *   SSG markup ships, and what a tooltip no pointer has ever visited
 *   keeps wearing, which is every tooltip on a page driven by the
 *   keyboard. Upstream needs none of this: it has no standing
 *   grace area to reshape, and builds one from the pointer's exit each
 *   time instead. `enter` and `leave` both follow the pointer, from
 *   opposite ends; `initial` draws the arrow-seated strip, which is the
 *   right one for a crossing nobody is making.
 * - Turning that off is `hoverable={false}`, not upstream's
 *   `disableHoverableContent`. Positive and defaulted true, matching
 *   `Text`'s `selectable`, and it works the opposite way round: upstream
 *   has to hear the pointer leave the trigger and close, where here the
 *   surface stops catching the pointer, so the pointer goes through it and
 *   there's nothing inside the root to hover but the trigger. No second
 *   open condition to keep in step with the first.
 *   Upstream's content still blocks what's under it, and ours doesn't
 *   while hover alone holds it open. That's hard to perceive, since the
 *   pointer can't be over the tooltip then without having closed it.
 *   While focus holds it open, ours catches the pointer like upstream's,
 *   so a press on it blurs the trigger and closes it instead of reaching
 *   the page underneath.
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
 * - Every document and window listener is attached only while the
 *   tooltip is open, so a page of closed tooltips listens for nothing,
 *   and all but one are passive.
 * - That one is Escape. A showing tooltip cancels the Escape that
 *   dismisses it, so a dialog around the trigger closes on the next
 *   press rather than the same one, as upstream's layer stack has it.
 *   Upstream only hears Escape once the tooltip has opened; ours hears
 *   it during the wait too, and dismisses without cancelling, since
 *   there's nothing on screen yet to have claimed it.
 * - One tooltip shows at a time, as upstream, but only with script: a
 *   tooltip showing supersedes whichever was up, which takes the same
 *   veto as a dismissal and keeps it until it closes. Without script,
 *   focus on one trigger and the pointer on another show both.
 * - The skip delay is script too, fixed at upstream's 300ms default
 *   with no `skipDelayDuration` prop: while a tooltip is up, and for
 *   300ms after the last one goes, the rest show with no wait and no
 *   entrance (`data-skip-delay` on the root). CSS can't do it: the only
 *   memory it has is a transition, and a transitioning custom property
 *   is barred from `animation-*` values, which is where the wait lives.
 *   Without script, every hover waits, and the hand-off from a focused
 *   tooltip to a hovered one comes after the newcomer's wait.
 *
 * @see https://www.radix-ui.com/themes/docs/components/tooltip
 */

import {
  createMemo,
  createSignal,
  createUniqueId,
  mergeProps,
  splitProps,
  type JSX,
} from 'solid-js';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import {
  FloatingRoot,
  type FloatingAlignment,
  type FloatingElement,
  type FloatingRootDisplay,
  type FloatingSide,
} from '../_internal/floating-ui';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import TooltipWindow, {
  type TooltipPath,
  type TooltipPointer,
} from './tooltip-window';
import { useDismissal } from './use-dismissal';
import { useExclusive } from './use-exclusive';
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
 * description of its own composes the two. Showing and hiding is still
 * the stylesheet's, off the trigger's focus and hover, so the one
 * handler here has nothing to do with that.
 */
export interface TooltipTriggerProps {
  /** Id of the tooltip. Set whether or not it's open. */
  readonly 'aria-describedby': string;

  /**
   * Tells the tooltip a pointer has turned up, which is all the grace
   * area needs to know to shape itself for the crossing ahead. A
   * trigger with a pointer handler of its own has to call both.
   */
  readonly onPointerEnter: (event: PointerEvent) => void;

  /**
   * Tells the tooltip where that pointer is, so the grace area can aim
   * at the crossing it's about to make rather than the one the arrow
   * points at. Composes the same way.
   */
  readonly onPointerMove: (event: PointerEvent) => void;
}

/**
 * `Tooltip` props. Wraps its trigger and floats a short label next to
 * it on focus or hover.
 */
export interface TooltipProps
  extends
    RequiredTestIdProps,
    Omit<JSX.HTMLAttributes<FloatingElement>, 'role' | 'style' | 'children'> {
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

  /**
   * Whether the pointer can rest on the tooltip itself. Hoverable text
   * stays put while it's being read; unhoverable text is chrome, and
   * the pointer passes through it to the page underneath, except while
   * keyboard focus holds it open.
   * @default true
   */
  hoverable?: boolean;

  /** Class merged onto the surface. */
  class?: string;

  /**
   * Renders the trigger: a single focusable element, such as a button
   * or a link, with the given props spread onto it.
   */
  children: (trigger: TooltipTriggerProps) => JSX.Element;
}

/** The props every tooltip fills in unless told otherwise. */
const DEFAULTS = {
  side: 'top',
  align: 'center',
  sideOffset: 4,
  alignOffset: 0,
  hoverable: true,
} satisfies Partial<TooltipProps>;

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
    'hoverable',
    'class',
    'children',
  ]);

  const contentId = createUniqueId();

  // What the dismissals measure against. The tooltip inspects only what
  // it rendered: the root, holding the trigger and the window, and the
  // window itself.
  const [root, setRoot] = createSignal<HTMLElement>();
  const [subject, setSubject] = createSignal<FloatingElement>();

  // Whether the stylesheet considers the tooltip open, as the root
  // reports it (see `css.root`). The tether rides on this, so a closed
  // window is never measured and a page of closed tooltips isn't
  // listening for anything.
  const [open, setOpen] = createSignal(false);

  // Whether the window has shown since the tooltip opened: its entrance
  // has started, with the wait behind it. Not `open()`, which turns true
  // as the wait begins, before there's anything on screen.
  const [entered, setEntered] = createSignal(false);

  // The component's veto on an open window (see `css.window`).
  const dismissal = useDismissal({ open, entered, root, subject });

  // An open window nobody has vetoed: the one worth measuring. Named
  // rather than written inline on the prop, where Solid would compile
  // the `&&` into a getter that builds a memo on every read — and the
  // window reads it from event handlers, where nothing would own it.
  const tethered = createMemo(() => open() && !dismissal.dismissed());

  // One tooltip on the page at a time. Showing claims the page, and
  // losing it to another is a dismissal like any other: the veto holds
  // until the tooltip closes and lifts on its next open. Shortly after
  // one shows, the rest skip their wait.
  const exclusive = useExclusive({
    id: contentId,
    showing: () => entered() && !dismissal.dismissed(),
    onSuperseded: dismissal.dismiss,
  });

  // Whether this tooltip skips its wait. Settled when it opens and kept
  // until it closes: its own showing warms the page, and following that
  // would cut its entrance short. While closed it tracks the page, so
  // the stylesheet already has the answer when the pointer lands.
  const [skippedOnOpen, setSkippedOnOpen] = createSignal(false);
  const skipDelay = createMemo(() =>
    open() ? skippedOnOpen() : exclusive.warm(),
  );

  // The path across the grace area the strip has to serve. `initial`
  // until a pointer turns up and says otherwise, which is the whole of
  // the progressive enhancement: with no script there's nobody to
  // watch a pointer, and with no pointer there's nothing to watch, so
  // the strip has to hold whichever way anyone is travelling.
  const [path, setPath] = createSignal<TooltipPath>('initial');

  // Where the pointer last was, and which end of the grace area it was
  // over. Client coordinates, untranslated: the window is the end that
  // knows where it landed and which edge the strip spans, so turning
  // them into an offset along that edge is its job, not the trigger's.
  const [pointer, setPointer] = createSignal<TooltipPointer>();

  // The pointer arriving at the trigger. That's the start of a
  // hover-opened tooltip's life, and it's also the end of a return
  // trip back across the grace area; either way the crossing ahead is
  // the one out to the window.
  const triggerProps: TooltipTriggerProps = {
    'aria-describedby': contentId,
    onPointerEnter: () => setPath('enter'),

    // Only while there's a window wanting the pointer: nothing reads
    // the position otherwise, and a page of closed tooltips shouldn't
    // be writing signals on every move across a trigger.
    onPointerMove: (event: PointerEvent) => {
      if (!open()) return;

      setPointer({ target: 'anchor', x: event.clientX, y: event.clientY });
    },
  };

  // Heard on the root, so any animation inside it arrives here too —
  // the trigger's, and the window's own arrival. Only the open signal
  // is ours to read.
  const onOpenChange = (event: AnimationEvent) => {
    if (event.animationName === css.enter && event.type === 'animationstart') {
      setEntered(true);
    }

    if (event.animationName !== css.open) return;

    const opening = event.type === 'animationstart';
    if (opening) setSkippedOnOpen(exclusive.warm());
    setOpen(opening);

    if (!opening) {
      setEntered(false);
      dismissal.clear();

      // Nobody is standing on a closed tooltip, so whatever path the
      // next visit takes, it starts at the trigger. Not back to
      // `initial`: that's the strip nothing has happened to yet, and
      // by the time a handler is running, something has.
      setPath('enter');
    }
  };

  return (
    <FloatingRoot
      display={local.display}
      class={css.root}
      data-hoverable={String(local.hoverable)}
      data-skip-delay={skipDelay() ? '' : undefined}
      style={assignInlineVars({
        ...(local.maxWidth !== undefined && {
          [css.maxWidth]: local.maxWidth,
        }),
      })}
      onClick={dismissal.onRootClick}
      onAnimationStart={onOpenChange}
      onAnimationCancel={onOpenChange}
      ref={setRoot}
    >
      {local.children(triggerProps)}

      <TooltipWindow
        {...rest}
        contentId={contentId}
        content={local.content}
        aria-label={local['aria-label']}
        side={local.side}
        align={local.align}
        sideOffset={local.sideOffset}
        alignOffset={local.alignOffset}
        tethered={tethered()}
        dismissed={dismissal.dismissed()}
        path={path()}
        pointer={pointer}
        setPointer={setPointer}
        // The pointer having crossed and arrived. Lands on the surface
        // rather than the window because the strip is a pseudo-element
        // of the window and answers to it as its event target, so the
        // window's own boundary is the start of the crossing rather
        // than the end.
        onPointerEnter={() => setPath('leave')}
        class={local.class}
        testId={tid.testId}
        ref={setSubject}
      />
    </FloatingRoot>
  );
};

export default Tooltip;
