/**
 * Alert Dialog component.
 *
 * A `Dialog` narrowed to one job: interrupt with a question that has to
 * be answered before anything else happens. Upstream builds it by
 * wrapping the Dialog primitive and changing four things — the role
 * becomes `alertdialog`, an outside click stops dismissing, the
 * description turns required, and initial focus lands on the safe
 * choice. This does the same, over our `Dialog`.
 *
 * Deviations from Radix:
 * - The buttons are the API, not children. Upstream's `Action` /
 *   `Cancel` are `Dialog.Close` in a trench coat, and every one of its
 *   examples lays them out the same way; the pair is what makes this an
 *   alert dialog rather than a dialog, so it's `action` / `cancel`
 *   props and a layout the component owns. What's left for `children`
 *   is the occasional extra — a confirmation field, a list of what's
 *   about to be lost.
 * - `onAction` reports the choice; it doesn't perform the close.
 *   Closing still arrives as `onOpenChange(false)` right after, which
 *   the call site can decline the same way it declines Escape — that's
 *   how a confirm that has to await a request keeps the dialog up.
 * - Initial focus is `autofocus` on Cancel instead of upstream's
 *   `onOpenAutoFocus` + a ref. Same destination by default, and it
 *   survives body content that would otherwise win the platform's focus
 *   delegate on sheer position. It also leaves the door open the way
 *   the platform does: `autofocus` in `children` sits earlier in tree
 *   order, so the delegate reaches it first and a "type the name to
 *   confirm" field can take focus. Upstream's imperative version
 *   overrides unconditionally.
 * - `description` is required. Upstream only enforces it with a
 *   dev-time console warning, but `alertdialog` is the one role where a
 *   missing description leaves screen reader users with a question and
 *   no stakes.
 * - Escape still asks to close, matching upstream — it's the keyboard's
 *   Cancel, and Cancel is always safe. An outside click never does.
 * - `maxWidth` defaults to `450px` rather than Dialog's `600px`.
 *   Upstream leaves it at the Dialog default and passes `450px` in
 *   every alert dialog example instead.
 * - No `size` variance in the copy: title and description render at
 *   Dialog's sizes, since upstream's Alert Dialog reuses Dialog's
 *   `Title` / `Description` verbatim.
 *
 * @see https://www.radix-ui.com/themes/docs/components/alert-dialog
 */

import { Show, mergeProps, splitProps } from 'solid-js';
import type { Component, JSX } from 'solid-js';
import Button from '../button/button';
import Dialog, { type DialogAlign, type DialogSize } from '../dialog/dialog';
import Flex from '../flex/flex';
import type { ButtonColor } from '../../props/button';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import * as css from './alert-dialog.css';

/**
 * `AlertDialog` props. Renders a modal dialog with a required
 * description and a cancel/confirm pair.
 */
export interface AlertDialogProps
  extends
    RequiredTestIdProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, 'title' | 'style' | 'role'> {
  /** Whether the dialog is showing. */
  open: boolean;
  /**
   * Fires when the user asks to close — Escape, Cancel, or straight
   * after a confirm. Only ever called with `false`; opening is the call
   * site's, and so is declining a close that shouldn't land yet.
   */
  onOpenChange: (open: boolean) => void;
  /** Heading at the top of the panel. Also the dialog's accessible name. */
  title: JSX.Element;
  /**
   * What the choice costs. Required — the `alertdialog` role promises
   * assistive tech there are stakes to read out.
   */
  description: JSX.Element;
  /** Label for the confirming button. */
  action: JSX.Element;
  /**
   * Fires when the user confirms, just before the close request. Do the
   * work here; leave the closing to `onOpenChange`.
   */
  onAction: () => void;
  /** Label for the button that backs out. @default 'Cancel' */
  cancel?: JSX.Element;
  /**
   * Semantic color for the confirming button. Reach for `'danger'` when
   * the action destroys something. @default 'accent'
   */
  color?: ButtonColor;
  /** Panel padding and rounding on a 1–4 scale. @default 3 */
  size?: DialogSize;
  /** Where the panel sits when it's shorter than the viewport. @default 'center' */
  align?: DialogAlign;
  /** Any CSS width for the panel. @default '450px' */
  maxWidth?: string;
  /** `class` lands on the panel — the visible surface, not the overlay. */
  class?: string;
  /**
   * Extra content between the description and the buttons. Opening
   * focus goes to the cancelling button, unless something in here
   * carries `autofocus` — it comes first in tree order, so the platform
   * hands it focus instead.
   */
  children?: JSX.Element;
}

/**
 * Modal dialog that interrupts with a decision. Unlike `Dialog` it
 * can't be waved away by clicking outside, and it opens with the
 * cancelling button focused, so a reflexive Enter is always the safe
 * answer.
 */
const AlertDialog: Component<AlertDialogProps> = (rawProps) => {
  const props = mergeProps(
    { cancel: 'Cancel', color: 'accent' as const, maxWidth: '450px' },
    rawProps,
  );
  const [tid, withoutTid] = splitProps(props, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'open',
    'onOpenChange',
    'title',
    'description',
    'action',
    'onAction',
    'cancel',
    'color',
    'size',
    'align',
    'maxWidth',
    'class',
    'children',
  ]);

  // Confirming is still only a request to close, so a call site that
  // has to wait on the network can hold the dialog up while it does.
  const onConfirm = () => {
    local.onAction();
    local.onOpenChange(false);
  };

  return (
    <Dialog
      {...rest}
      role="alertdialog"
      dismissible="escape"
      open={local.open}
      onOpenChange={local.onOpenChange}
      title={local.title}
      description={local.description}
      size={local.size}
      align={local.align}
      maxWidth={local.maxWidth}
      class={local.class}
      testId={tid.testId}
    >
      <Show when={local.children !== undefined}>
        <div class={css.body}>{local.children}</div>
      </Show>

      <Flex as="div" justify="end" gap={3}>
        {/* `autofocus` is what puts the platform's opening focus on the
            safe choice, ahead of anything merely focusable in the body.
            A body control that asks for focus by name still wins on
            tree order, which is the escape hatch. */}
        <Button
          as="button"
          variant="soft"
          color="neutral"
          autofocus
          testId={`${tid.testId}-cancel`}
          onClick={() => local.onOpenChange(false)}
        >
          {local.cancel}
        </Button>
        <Button
          as="button"
          color={local.color}
          testId={`${tid.testId}-action`}
          onClick={onConfirm}
        >
          {local.action}
        </Button>
      </Flex>
    </Dialog>
  );
};

export default AlertDialog;
