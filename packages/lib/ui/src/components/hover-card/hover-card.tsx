/**
 * HoverCard component.
 *
 * Ported from Radix UI Themes HoverCard, on the internal floating-ui
 * primitive. A card of supplementary content that floats beside its
 * trigger while the pointer or keyboard focus rests there.
 *
 * @see https://www.radix-ui.com/themes/docs/components/hover-card
 */

import {
  createEffect,
  createSignal,
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

  /** The trigger: a single focusable element, usually a link. */
  children: JSX.Element;
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
  const [windowElement, setWindowElement] = createSignal<HTMLElement>();

  // The window stays mounted; this says when it's on screen, exit
  // included, which is as long as the tether has anything to do.
  const visibility = createVisibility({ open, element: windowElement });
  const surface = () => SURFACE_BY_SIZE[local.size];

  // Anything holding the card up. Settling on a change waits out the
  // delay, and a change back before then cancels it — which is what
  // carries the pointer across the gap between trigger and card.
  const wanted = () => hovered() || focused();
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
      {local.children}

      <FloatingWindow
        {...visibility.props}
        ref={setWindowElement}
        class={clx(motion.window, css.window)}
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
