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
 *   trigger's focus (and, later, hover), which the component owns end
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
 * - Focus arrives as `focusin` / `focusout`, the bubbling pair Solid
 *   delegates, rather than upstream's `focus` / `blur`.
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
 *   `data-state` on the window decides whether it shows. The tether
 *   engages only while open, so a closed tooltip costs no measurement.
 * - `aria-describedby` is static. Upstream sets it only while open,
 *   because a closed tooltip is unmounted and the id would dangle. Here
 *   the tooltip is always in the DOM, and the accessible description
 *   reads a referenced node even when it's hidden, so the trigger is
 *   described at all times: a screen reader browsing by virtual cursor
 *   or touch, which never focuses the trigger, still gets the text, and
 *   focus can't race the attribute.
 * - Focus only, for now. Hover, dismissal, hoverable content, and
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
import * as css from './tooltip.css';

/** Edge of the trigger the tooltip binds to. */
export type TooltipSide = FloatingSide;

/** Placement along that edge. */
export type TooltipAlign = FloatingAlignment;

/** How the wrapper around the trigger sits in the surrounding flow. */
export type TooltipDisplay = FloatingRootDisplay;

/**
 * Whether the tooltip is showing, and how it got there. Rides on the
 * window as `data-state`, which is what shows and hides it.
 */
export type TooltipState = 'closed' | 'instant-open';

/**
 * What the tooltip hands its trigger. Spread onto the focusable element
 * as-is: the handlers drive the tooltip, and the description names the
 * tooltip. A trigger with a description of its own composes the two.
 */
export interface TooltipTriggerProps {
  /** Id of the tooltip. Set whether or not it's open. */
  readonly 'aria-describedby': string;

  /** Opens at once. */
  readonly onFocusIn: () => void;

  /** Closes. */
  readonly onFocusOut: () => void;
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

/**
 * A short label that floats beside its trigger while keyboard focus
 * rests on it. Announced to assistive tech as the trigger's
 * description.
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

  const [state, setState] = createSignal<TooltipState>('closed');
  const contentId = createUniqueId();

  const open = () => state() !== 'closed';

  const triggerProps: TooltipTriggerProps = {
    'aria-describedby': contentId,
    onFocusIn: () => setState('instant-open'),
    onFocusOut: () => setState('closed'),
  };

  return (
    <FloatingRoot display={local.display}>
      {local.children(triggerProps)}

      <FloatingWindow
        side={local.side}
        align={local.align}
        sideOffset={local.sideOffset}
        alignOffset={local.alignOffset}
        radius={2}
        arrow={{}}
        class={css.window}
        data-state={state()}
        testId={tid.testId}

        // Withheld while closed: a hidden window has nothing to measure,
        // and a page of closed tooltips shouldn't be listening for scroll.
        tether={open() ? TETHER : undefined}
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
