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
 *   clip it and a later sibling can paint over it. The top layer is a
 *   planned enhancement.
 * - No `open` / `defaultOpen` / `onOpenChange`. The open state is the
 *   trigger's focus (and, later, hover), which the stylesheet owns end
 *   to end; there is nothing for a call site to drive.
 * - `display` is required, from the floating root: the wrapper is a
 *   `<span>` or a `<div>`, and only the call site knows which one is
 *   valid where it stands.
 * - `children` is a render function. Upstream merges its handlers and
 *   `aria-describedby` into the child via `asChild`; here the trigger
 *   is handed them as props and spreads them itself, so the tooltip
 *   never inspects or writes to an element it didn't render. A trigger
 *   with a description of its own composes the two — nothing is merged
 *   for it. No `data-state` rides on the trigger.
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
 *   so, and the tether engages between the two. A closed tooltip costs
 *   no measurement and no scroll listener. Upstream's tether runs for
 *   as long as the content is mounted, which is the same span.
 * - `aria-describedby` is static. Upstream sets it only while open,
 *   because a closed tooltip is unmounted and the id would dangle. Here
 *   the tooltip is always in the DOM, and the accessible description
 *   reads a referenced node even when it's hidden, so the trigger is
 *   described at all times: a screen reader browsing by virtual cursor
 *   or touch, which never focuses the trigger, still gets the text, and
 *   focus can't race the attribute.
 * - Dismissal is a veto, not a close. Escape marks the window
 *   `data-dismissed`, which hides it while the stylesheet still wants
 *   it open; the veto lifts when the stylesheet stops wanting that,
 *   i.e. when focus leaves. That the veto can hide the window
 *   outright, rather than tiptoeing around its own open signal, is why
 *   the signal sits on the root. Upstream closes and reopens on the
 *   next focus, which comes to the same thing. Its guard against the
 *   focus a press brings reopening the tooltip (a flag held until the
 *   next `pointerup`) has no counterpart here: `:focus-visible`
 *   already declines that focus.
 * - Upstream also dismisses on a press outside the window and on a
 *   scroll that moves the trigger. Neither is here yet. A press
 *   already closes the tooltip by blurring the trigger, except when
 *   something prevents the default to keep focus, and scroll wants
 *   deciding alongside the tether. Both land in a later phase.
 * - The Escape listener is passive, and attached only while the
 *   tooltip is open. A page of closed tooltips listens for nothing.
 * - Focus and Escape only, for now. Hover, hoverable content, and
 *   page-wide coordination are landing in phases.
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
 * stylesheet's, off the trigger's focus, so there are no handlers.
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
 * A short label that floats beside its trigger while keyboard focus
 * rests on it, until Escape dismisses it.
 * Announced to assistive tech as the trigger's description, open or
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

  // Listened for on the document only while open and not yet
  // dismissed. Escape has no target to speak of: it's aimed at whatever
  // is on screen, and the tooltip is.
  useGlobalListener(
    () => (open() && !dismissed() ? document : undefined),
    'keydown',
    PASSIVE,
    (event) => {
      if (event.key === 'Escape') setDismissed(true);
    },
  );

  return (
    <FloatingRoot
      display={local.display}
      class={css.root}
      onAnimationStart={onOpenChange}
      onAnimationCancel={onOpenChange}
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
