/**
 * Popover component.
 *
 * Ported from Radix UI Themes Popover, on the internal floating-ui
 * primitive. A non-modal dialog bound to its trigger: the window
 * measures against the trigger and flips or shifts to stay on screen.
 *
 * Deviations from Radix:
 * - One component. Upstream's `Root` / `Trigger` / `Content` / `Close`
 *   / `Anchor` collapse into `Popover`: the trigger is the render
 *   function's element, the content is a prop, and closing is
 *   `onOpenChange(false)`, so `Close` has nothing left to do. The
 *   trigger is the anchor; there's no separate `Anchor`.
 * - No portal. The window renders next to its trigger, inline, so an
 *   `overflow` ancestor can clip it and a later sibling can paint over
 *   it. Same trade as `Tooltip`. The top layer (`popover`) would lift
 *   it out, but it also discards the CSS placement the window relies on
 *   until anchor positioning can take over.
 * - Fully controlled — `open` and `onOpenChange` are required. No
 *   `defaultOpen`, no internal signal.
 * - `display` is required, from the floating root, as on `Tooltip`. An
 *   inline popover's content must be phrasing content.
 * - `children` is a render function. Upstream merges its ARIA and
 *   click handler into the child via `asChild`; here the trigger is
 *   handed them as props and spreads them itself.
 * - `aria-controls` is only set while open. Upstream sets it always,
 *   pointing at content it has unmounted.
 * - Non-modal only. No `modal` prop: a modal popover is a `Dialog`.
 * - Collision handling is fixed at Themes' values (`collisionPadding`
 *   10, `sticky="partial"`, collisions avoided) and not exposed. Nor are
 *   `arrowPadding`, `collisionBoundary`, `hideWhenDetached`,
 *   `forceMount`, or `container`.
 * - `size` is a plain scale, not a responsive object.
 * - `width`, `minWidth`, and the height props aren't exposed; `maxWidth`
 *   is.
 * - Dismissal isn't configurable. Escape, a press outside, and focus
 *   moving outside always close; there's no `onEscapeKeyDown`,
 *   `onPointerDownOutside`, `onFocusOutside`, or `onInteractOutside`.
 * - No layer stack. Escape goes to whatever claims it nearest the focus
 *   first, and the popover only takes it if nothing has, so popovers
 *   nested in popovers aren't ordered.
 * - Opening focuses the first `autofocus` descendant, else the first
 *   tabbable one that isn't a link, else the surface. Upstream skips
 *   `autofocus`; honoring it matches `Dialog`. Text isn't selected on
 *   the way in, and there's no `onOpenAutoFocus` / `onCloseAutoFocus`.
 * - Deferred: `highContrast` styling.
 *
 * @see https://www.radix-ui.com/themes/docs/components/popover
 */

import {
  Show,
  createEffect,
  createSignal,
  on,
  createUniqueId,
  mergeProps,
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
import { createPresence } from '../_internal/presence';
import { focusInto, NO_SCROLL } from './focus';
import { useDismissal, type DismissalReason } from './use-dismissal';
import * as css from './popover.css';

/** Edge of the trigger the popover binds to. */
export type PopoverSide = FloatingSide;

/** Placement along that edge. */
export type PopoverAlign = FloatingAlignment;

/** How the wrapper around the trigger sits in the surrounding flow. */
export type PopoverDisplay = FloatingRootDisplay;

/** Surface padding and rounding on a 1–4 scale. */
export type PopoverSize = 1 | 2 | 3 | 4;

/**
 * What the popover hands its trigger. Spread onto the button as-is: the
 * ARIA names the relationship, and the click toggles the popover. A
 * trigger with a click handler of its own has to call both.
 */
export interface PopoverTriggerProps {
  /** Announces that the button opens a dialog. */
  readonly 'aria-haspopup': 'dialog';

  /** Whether the popover is open. */
  readonly 'aria-expanded': boolean;

  /** Id of the popover's surface, while it's open. */
  readonly 'aria-controls': string | undefined;

  /** Toggles the popover through `onOpenChange`. */
  readonly onClick: (event: MouseEvent) => void;

  /** Where focus returns when the popover closes. */
  readonly ref: (element: HTMLElement) => void;
}

/**
 * `Popover` props. Wraps its trigger and floats a panel of content next
 * to it while open.
 */
export interface PopoverProps
  extends
    RequiredTestIdProps,
    Omit<
      JSX.HTMLAttributes<FloatingElement>,
      'role' | 'style' | 'children' | 'content'
    > {
  /** Whether the popover is showing. */
  open: boolean;

  /**
   * Fires when the trigger asks to open or close, and with `false` on
   * Escape, a press outside, or focus moving outside.
   */
  onOpenChange: (open: boolean) => void;

  /**
   * How the wrapper around the trigger sits in the surrounding flow:
   * `inline` renders it and the popover as `<span>`s, `block` as a
   * `<div>` and block elements. Required — the wrong one is invalid
   * markup inside a paragraph or a stray baseline gap under a layout
   * box, and the component can't tell which it's in.
   */
  display: PopoverDisplay;

  /** The panel to float. Name it with `aria-label` or `aria-labelledby`. */
  content: JSX.Element;

  /** Edge of the trigger the popover binds to. @default 'bottom' */
  side?: PopoverSide;

  /** Placement along that edge. @default 'start' */
  align?: PopoverAlign;

  /** Gap between the trigger and the surface, in px. @default 8 */
  sideOffset?: number;

  /**
   * Nudge along the bound edge, in px. Ignored when centered.
   * @default 0
   */
  alignOffset?: number;

  /** Surface padding and rounding on a 1–4 scale. @default 2 */
  size?: PopoverSize;

  /** Any CSS width the surface wraps at. @default '480px' */
  maxWidth?: string;

  /** Class merged onto the surface. */
  class?: string;

  /**
   * Renders the trigger: a single button, with the given props spread
   * onto it.
   */
  children: (trigger: PopoverTriggerProps) => JSX.Element;
}

/** The props every popover fills in unless told otherwise. */
const DEFAULTS = {
  side: 'bottom',
  align: 'start',
  sideOffset: 8,
  alignOffset: 0,
  size: 2,
} satisfies Partial<PopoverProps>;

/** Themes' padding and radius for each size. */
const SURFACE_BY_SIZE: Record<
  PopoverSize,
  { padding: SpaceScale; radius: RadiusScale }
> = {
  1: { padding: 3, radius: 4 },
  2: { padding: 4, radius: 4 },
  3: { padding: 5, radius: 5 },
  4: { padding: 6, radius: 5 },
};

/** Themes' collision settings, resolved once for every popover. */
const TETHER: FloatingTether = {
  middleware: [
    shift({ padding: 10, limiter: limitShift() }),
    flip({ padding: 10 }),
  ],
};

/**
 * A panel of content that floats beside its trigger while open. A
 * non-modal dialog: the rest of the page stays interactive.
 */
const Popover = (rawProps: PopoverProps) => {
  const props = mergeProps(DEFAULTS, rawProps);
  const [tid, withoutTid] = splitProps(props, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'open',
    'onOpenChange',
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

  const [root, setRoot] = createSignal<HTMLElement>();
  const [trigger, setTrigger] = createSignal<HTMLElement>();
  const [surfaceElement, setSurfaceElement] = createSignal<HTMLElement>();
  const [windowElement, setWindowElement] = createSignal<HTMLElement>();

  // Holds the window mounted while its exit plays.
  const presence = createPresence({
    open: () => local.open,
    element: windowElement,
  });
  const contentId = createUniqueId();
  const surface = () => SURFACE_BY_SIZE[local.size];

  const triggerProps: PopoverTriggerProps = {
    'aria-haspopup': 'dialog',
    get 'aria-expanded'() {
      return local.open;
    },
    get 'aria-controls'() {
      return local.open ? contentId : undefined;
    },
    onClick: () => local.onOpenChange(!local.open),
    ref: setTrigger,
  };

  // Focus goes back to the trigger on close, unless the user has already
  // put it somewhere else by pressing or focusing outside.
  let returnFocus = true;

  useDismissal({
    open: () => local.open,
    root,
    dismiss: (reason: DismissalReason) => {
      if (reason === 'outside') returnFocus = false;
      local.onOpenChange(false);
    },
  });

  createEffect(
    on(
      () => local.open,
      (open, wasOpen) => {
        if (open) returnFocus = true;
        else if (wasOpen && returnFocus) trigger()?.focus(NO_SCROLL);
      },
    ),
  );

  // Into the surface once it's on the page: a fresh one once presence
  // mounts it, or the same one on a reopen that caught it mid-exit. A
  // surface left over from an earlier open is detached, and skipped.
  createEffect(
    on([() => local.open, surfaceElement], ([open, surface]) => {
      if (open && surface?.isConnected) focusInto(surface);
    }),
  );

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
    >
      {local.children(triggerProps)}

      <Show when={presence.mounted()}>
        <FloatingWindow
          {...presence.props}
          ref={setWindowElement}
          class={css.window}
          side={local.side}
          align={local.align}
          sideOffset={local.sideOffset}
          alignOffset={local.alignOffset}
          radius={surface().radius}
          tether={TETHER}
          testId={tid.testId}
        >
          <FloatingBody
            {...rest}
            ref={setSurfaceElement}
            role="dialog"
            id={contentId}
            tabindex={-1}
            p={surface().padding}
            class={clx(css.content, local.class)}
            testId={`${tid.testId}-surface`}
          >
            {local.content}
          </FloatingBody>
        </FloatingWindow>
      </Show>
    </FloatingRoot>
  );
};

export default Popover;
