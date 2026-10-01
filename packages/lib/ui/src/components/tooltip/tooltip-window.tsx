/**
 * The tooltip's window: the floating subtree under its root.
 *
 * Its own component so it renders under `FloatingRoot` rather than
 * around it, which is what puts the root's tether state in reach. The
 * deviations from Radix are the tooltip's, and listed there.
 *
 * @see https://www.radix-ui.com/themes/docs/components/tooltip
 */

import { splitProps, type JSX } from 'solid-js';
import { flip, limitShift, shift } from '@floating-ui/dom';
import clx from '@lib/classnames';
import {
  FloatingBody,
  FloatingWindow,
  type FloatingAlignment,
  type FloatingSide,
  type FloatingTether,
} from '../_internal/floating-ui';
import Text from '../text/text';
import { type RequiredTestIdProps } from '../../props/test-id';
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
    'class',
    'testId',
    'ref',
  ]);

  return (
    <FloatingWindow
      data-dismissed={local.dismissed ? '' : undefined}
      data-path={local.path}
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
