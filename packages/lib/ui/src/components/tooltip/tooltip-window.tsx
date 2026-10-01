/**
 * The tooltip's window: the floating subtree under its root.
 *
 * Its own component so it renders under `FloatingRoot` rather than
 * around it, which is what puts the root's tether state in reach. The
 * deviations from Radix are the tooltip's, and listed there.
 *
 * @see https://www.radix-ui.com/themes/docs/components/tooltip
 */

import { splitProps, type Accessor, type JSX, type Setter } from 'solid-js';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { flip, limitShift, shift } from '@floating-ui/dom';
import clx from '@lib/classnames';
import {
  AXIS_BY_SIDE,
  FloatingBody,
  FloatingWindow,
  useTetherState,
  type FloatingAlignment,
  type FloatingSide,
  type FloatingTether,
} from '../_internal/floating-ui';
import Text from '../text/text';
import { type RequiredTestIdProps } from '../../props/test-id';
import * as grace from './grace-area.css';
import * as css from './tooltip.css';

/**
 * The path across the grace area the strip has to serve, which is what
 * shapes it. Rides on the window as `data-path`.
 *
 * `initial` is no path yet: no script to watch a pointer with, or no
 * pointer that has turned up to watch, so the strip has to hold
 * whichever way anyone travels. The other two are a pointer the
 * component can see — `enter` while it's still on its way over,
 * `leave` once it has arrived and the only path left is the way back.
 */
export type TooltipPath = 'initial' | 'enter' | 'leave';

/**
 * Where the pointer last was, in client coordinates, and which end of
 * the grace area it was over when it was seen there: the `anchor` end,
 * with the crossing still ahead of it, or the `window` end, having made
 * it. The trigger and the surface each report their own end, so there's
 * no guessing which from a coordinate.
 */
export interface TooltipPointer {
  /** Which end of the grace area the pointer was over. */
  target: 'anchor' | 'window';

  /** Distance from the viewport's left edge, in px. */
  x: number;

  /** Distance from the viewport's top edge, in px. */
  y: number;
}

/**
 * `TooltipWindow` props. Everything is resolved by the tooltip, and
 * anything not named here spreads onto the surface.
 */
export interface TooltipWindowProps
  extends
    RequiredTestIdProps,
    Omit<
      JSX.HTMLAttributes<HTMLDivElement>,
      'role' | 'style' | 'children' | 'ref'
    > {
  /** Id of the tooltip, which the trigger is described by. */
  contentId: string;

  /** The label to float. */
  content: JSX.Element;

  /** What assistive tech reads in place of {@link content}. */
  'aria-label'?: string;

  /** Edge of the trigger the tooltip binds to. */
  side: FloatingSide;

  /** Placement along that edge. */
  align: FloatingAlignment;

  /** Gap between the trigger and the arrow's tip, in px. */
  sideOffset: number;

  /** Nudge along the bound edge, in px. */
  alignOffset: number;

  /** Whether the window is measured against its trigger. */
  tethered: boolean;

  /** Whether the open window has been vetoed. */
  dismissed: boolean;

  /** The path across the grace area the strip has to serve. */
  path: TooltipPath;

  /**
   * Where the pointer last was. Read rather than taken as a value: the
   * window turns it into an offset along the edge the strip spans,
   * which is a measurement, and measuring belongs where the reading
   * happens.
   */
  pointer: Accessor<TooltipPointer | undefined>;

  /** Records the pointer arriving on the surface. */
  setPointer: Setter<TooltipPointer | undefined>;

  /** Class merged onto the surface. */
  class?: string;

  /** Receives the window element. */
  ref: (element: HTMLDivElement) => void;
}

/** Themes' collision settings, resolved once for every tooltip. */
const TETHER: FloatingTether = {
  middleware: [
    shift({ padding: 10, limiter: limitShift() }),
    flip({ padding: 10 }),
  ],
};

/**
 * The window, its surface, and the text on it. Must render under the
 * tooltip's `FloatingRoot`.
 */
const TooltipWindow = (props: TooltipWindowProps) => {
  const [local, rest] = splitProps(props, [
    'contentId',
    'content',
    'aria-label',
    'side',
    'align',
    'sideOffset',
    'alignOffset',
    'tethered',
    'dismissed',
    'path',
    'pointer',
    'setPointer',
    'class',
    'testId',
    'ref',
  ]);

  // Where this window landed, from the root's slot. The window writes
  // the resolved side to `data-side` for the rules that only style it;
  // this is the same answer in JavaScript, for picking which of the
  // pointer's two coordinates runs along the edge the strip spans.
  const tether = useTetherState();
  const axis = () => AXIS_BY_SIDE[tether()?.side() ?? local.side];

  let surface: HTMLDivElement | undefined;

  // The pointer's place along the edge the strip spans, measured from
  // the strip's start, as the length the taper's narrow end comes down
  // on. Only while the pointer is at the anchor end, which is the only
  // crossing the taper can be aimed at: once it's on the surface the
  // way back is served by the window-wide end of the strip, and a
  // pointer nobody has seen leaves the strip on its arrow-seated
  // shape.
  const cursor = () => {
    const pointer = local.pointer();

    if (pointer?.target !== 'anchor') return undefined;

    // TODO: take the rect off the tether instead. Its middleware
    // measures this box every time it runs, so reading it again here is
    // a second layout measurement of the same thing, on the pointer's
    // path. Exposing the measured rects from the tether retires this.
    const box = surface?.getBoundingClientRect();

    if (!box) return undefined;

    const offset = axis() === 'y' ? pointer.x - box.left : pointer.y - box.top;

    // Whole pixels. The strip is a hit region, not a visible edge, so a
    // fraction of one is finer than anything the pointer can be aimed
    // at, and rounding means a pointer drifting inside a pixel leaves
    // the var alone instead of restyling the window and repainting the
    // clip path for every move. Not the tether's device-pixel snap:
    // that one is there to keep visible edges off the half-pixel.
    return `${Math.round(offset)}px`;
  };

  return (
    <FloatingWindow
      data-dismissed={local.dismissed ? '' : undefined}
      data-path={local.path}
      style={assignInlineVars({ [grace.cursor]: cursor() })}
      side={local.side}
      align={local.align}
      sideOffset={local.sideOffset}
      alignOffset={local.alignOffset}
      radius={2}
      arrow={{}}
      class={css.window}
      testId={local.testId}
      tether={local.tethered ? TETHER : undefined}
      ref={local.ref}
    >
      <FloatingBody
        {...rest}
        // The pointer on the surface is the pointer across, and the
        // surface is the right place to hear it: the strip answers to
        // the window as its event target, so a move over the strip
        // isn't one over the surface, and the taper can't chase a
        // pointer that's standing on it.
        onPointerMove={(event) => {
          if (!local.tethered) return;

          local.setPointer({
            target: 'window',
            x: event.clientX,
            y: event.clientY,
          });
        }}
        ref={(node: HTMLDivElement) => (surface = node)}
        testId={`${local.testId}-surface`}
        py={1}
        px={2}
        class={clx(css.content, local.class)}
      >
        <Text
          as="p"
          role="tooltip"
          id={local.contentId}
          aria-label={local['aria-label']}
          testId={`${local.testId}-text`}
          size={1}
          selectable={false}
          class={css.text}
        >
          {local.content}
        </Text>
      </FloatingBody>
    </FloatingWindow>
  );
};

export default TooltipWindow;
