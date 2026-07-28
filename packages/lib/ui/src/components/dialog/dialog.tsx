/**
 * Dialog component.
 *
 * Ported from Radix UI Themes Dialog, rebuilt on a native `<dialog>`
 * driven by `showModal()`. The platform supplies the modal contract —
 * top-layer promotion, the focus trap, inerting the rest of the
 * document, Escape handling, and focus restoration on close — so the
 * port is mostly styling plus the controlled-state wiring.
 *
 * Deviations from Radix:
 * - One component instead of six. Upstream's `Root` / `Trigger` /
 *   `Content` / `Title` / `Description` / `Close` compound exists to
 *   thread React context through a portal boundary; a `<dialog>` needs
 *   no portal, and the pieces that carried real API surface (title,
 *   description) are plain props here. Openers are ordinary buttons the
 *   consumer already owns, and closing is `onOpenChange(false)` — so
 *   `Trigger` and `Close` have nothing left to do.
 * - Fully controlled — `open` and `onOpenChange` are required. No
 *   `defaultOpen`, no internal signal.
 * - `title` is required. It is the dialog's accessible name, and
 *   upstream only enforces it with a dev-time console warning.
 * - Modal only. Upstream's `modal={false}` escape hatch has no native
 *   counterpart (`show()` doesn't reach the top layer), and a
 *   non-modal overlay is a popover, not a dialog.
 * - `onEscapeKeyDown` / `onPointerDownOutside` / `onInteractOutside`
 *   collapse into one `dismissible` flag. The events existed so callers
 *   could `preventDefault()` their way to a locked dialog; the flag says
 *   that directly.
 * - No `container` prop. Portal targets are moot in the top layer.
 * - No scroll lock. The UA blocks interaction with the document behind
 *   a modal dialog, which is what upstream's `react-remove-scroll`
 *   dependency was emulating.
 * - Initial focus is the platform's: the first `autofocus` descendant,
 *   else the first focusable one, else the dialog itself. Upstream
 *   always focuses its content wrapper, which reliably announces the
 *   dialog but costs consumers the ability to focus a field.
 * - A `<form method="dialog">` submit still reports through
 *   `onOpenChange`, and the DOM is put back if the call site declines —
 *   but the UA has already left the top layer by then, so that one path
 *   skips the exit animation.
 * - Escape is not always refusable. It doesn't count as user activation,
 *   so repeated presses spend the document's history-action activation
 *   and the UA starts closing the element regardless — its guard against
 *   pages that trap you in a dialog. Upstream, running on a `<div>`,
 *   never meets it. Here the dialog is put straight back up (visibly, on
 *   that press: the top layer is already gone), so `dismissible: false`
 *   still holds and a dismissible dialog still closes only when the call
 *   site agrees.
 * - Body content mounts with the dialog and unmounts after it closes,
 *   matching upstream. A `<dialog>` would otherwise keep its subtree
 *   (and any form state in it) alive across opens.
 *
 * @see https://www.radix-ui.com/themes/docs/components/dialog
 */

import {
  Show,
  createEffect,
  createSignal,
  createUniqueId,
  mergeProps,
  splitProps,
} from 'solid-js';
import type { JSX, ParentComponent } from 'solid-js';
import Heading from '../heading/heading';
import Text from '../text/text';
import { createPresence } from '../_internal/floating-ui/behaviors/presence';
import { testIdPropKeys, type RequiredTestIdProps } from '../../props/test-id';
import * as css from './dialog.css';

/** Panel padding and rounding on a 1–4 scale. */
export type DialogSize = 1 | 2 | 3 | 4;

/** Where the panel sits when it's shorter than the viewport. */
export type DialogAlign = 'start' | 'center';

/**
 * `Dialog` props. Renders a modal `<dialog>` filling the viewport, with
 * the panel centered inside its own scroll surface.
 */
export interface DialogProps
  extends
    RequiredTestIdProps,
    Omit<JSX.HTMLAttributes<HTMLDivElement>, 'title' | 'style'> {
  /** Whether the dialog is showing. */
  open: boolean;
  /**
   * Fires when the user asks to close — Escape, or a click outside the
   * panel. Only ever called with `false`; opening is the call site's.
   */
  onOpenChange: (open: boolean) => void;
  /** Heading at the top of the panel. Also the dialog's accessible name. */
  title: JSX.Element;
  /** Supporting copy under the title. Describes the dialog to assistive tech. */
  description?: JSX.Element;
  /** Panel padding and rounding on a 1–4 scale. @default 3 */
  size?: DialogSize;
  /** Where the panel sits when it's shorter than the viewport. @default 'center' */
  align?: DialogAlign;
  /**
   * Let Escape and outside clicks close the dialog. Turn off for flows
   * that must end in an explicit choice. @default true
   */
  dismissible?: boolean;
  /** Any CSS width for the panel. @default '600px' */
  maxWidth?: string;
  /** `class` lands on the panel — the visible surface, not the overlay. */
  class?: string;
  /** Body content, rendered under the title and description. */
  children?: JSX.Element;
}

/**
 * Modal dialog. Renders a `<dialog>` in place — no portal — and
 * promotes it to the top layer while open, so it paints above the page
 * regardless of where it sits in the tree.
 */
const Dialog: ParentComponent<DialogProps> = (rawProps) => {
  const props = mergeProps(
    { size: 3 as const, align: 'center' as const, dismissible: true },
    rawProps,
  );
  const [tid, withoutTid] = splitProps(props, [...testIdPropKeys]);
  const [local, rest] = splitProps(withoutTid, [
    'open',
    'onOpenChange',
    'title',
    'description',
    'size',
    'align',
    'dismissible',
    'maxWidth',
    'class',
    'children',
  ]);

  const titleId = createUniqueId();
  const descriptionId = createUniqueId();

  let overlayRef: HTMLDialogElement | undefined;
  let panelRef: HTMLElement | undefined;

  // Holds `[open]` — and with it the top-layer slot — until the exit
  // animation settles. `data-state` rides out onto the overlay for the
  // stylesheet to key both directions off.
  const presence = createPresence({
    open: () => local.open,
    element: () => overlayRef,
  });

  // Bumped whenever the UA closes the element without going through the
  // effect below, so the effect gets a chance to reconcile even though
  // neither `open` nor `mounted` moved.
  const [resyncTick, setResyncTick] = createSignal(0);

  createEffect(() => {
    resyncTick();
    const overlay = overlayRef;
    if (!overlay) return;

    if (presence.mounted()) {
      // `showModal()` throws on an already-open dialog, which is exactly
      // what a reopen mid-exit looks like: presence cancels the unmount
      // and re-runs this while `[open]` still stands.
      if (!overlay.open) overlay.showModal();
    } else if (overlay.open) {
      overlay.close();
    }
  });

  const isInsidePanel = (target: EventTarget | null) =>
    target instanceof Node && panelRef?.contains(target) === true;

  // A close request whose `cancel` came through non-cancelable — the UA
  // is closing the element no matter what we do here. Read and reset by
  // the `close` handler, which runs in a later task.
  let forcedDismissal = false;

  // Escape (and any other UA close request) is intercepted rather than
  // obeyed: the DOM's open state is ours to set, so the dialog only ever
  // closes by way of `onOpenChange`. Escape doesn't count as user
  // activation, though, so a run of them with nothing in between spends
  // the document's history-action activation and the UA starts sending
  // `cancel` non-cancelable — a deliberate guard against pages that trap
  // you in a dialog. `close` picks the aftermath up.
  const onCancel: JSX.EventHandler<HTMLDialogElement, Event> = (event) => {
    forcedDismissal = !event.cancelable;
    event.preventDefault();
    if (local.dismissible) local.onOpenChange(false);
  };

  // Fires for closes the component didn't initiate: the forced dismissal
  // above, or a `<form method="dialog">` submit inside the body. The
  // element has already left the top layer by now, so the exit animation
  // is forfeit either way; what's left is making the DOM agree with
  // `open` again.
  const onClose = () => {
    const forced = forcedDismissal;
    forcedDismissal = false;

    if (!local.open) return;

    // A forced dismissal was already offered to the call site by
    // `onCancel` — or withheld, if the dialog isn't dismissible. Either
    // way `open` is still true, so the dialog goes back up. Anything
    // else is a fresh request the call site hasn't seen yet.
    if (!forced) local.onOpenChange(false);
    setResyncTick((tick) => tick + 1);
  };

  // The overlay covers the viewport, so "outside" means outside the
  // *panel*. Both ends of the interaction have to land outside it —
  // otherwise a text selection dragged out of the panel would dismiss
  // on release.
  let pressedInsidePanel = false;

  const onPointerDown: JSX.EventHandler<HTMLDialogElement, PointerEvent> = (
    event,
  ) => {
    pressedInsidePanel = isInsidePanel(event.target);
  };

  const onClick: JSX.EventHandler<HTMLDialogElement, MouseEvent> = (event) => {
    if (!local.dismissible) return;
    if (pressedInsidePanel || isInsidePanel(event.target)) return;
    local.onOpenChange(false);
  };

  const panelClass = () =>
    [css.panel, css.size[local.size], local.class].filter(Boolean).join(' ');

  return (
    <dialog
      ref={(el) => {
        overlayRef = el;
      }}
      class={css.overlay}
      aria-labelledby={titleId}
      aria-describedby={
        local.description === undefined ? undefined : descriptionId
      }
      onCancel={onCancel}
      onClose={onClose}
      onPointerDown={onPointerDown}
      onClick={onClick}
      {...presence.props}
    >
      <Show when={presence.mounted()}>
        <div class={css.scroll}>
          <div class={`${css.scrollPadding} ${css.align[local.align]}`}>
            <div
              {...rest}
              ref={(el) => {
                panelRef = el;
              }}
              class={panelClass()}
              style={{ 'max-width': local.maxWidth }}
              data-testid={tid.testId}
            >
              <Heading
                as="h2"
                id={titleId}
                size={5}
                trim="start"
                selectable
                class={css.title}
              >
                {local.title}
              </Heading>
              <Show when={local.description !== undefined}>
                <Text
                  as="p"
                  id={descriptionId}
                  size={3}
                  selectable
                  class={css.description}
                >
                  {local.description}
                </Text>
              </Show>
              {local.children}
            </div>
          </div>
        </div>
      </Show>
    </dialog>
  );
};

export default Dialog;
