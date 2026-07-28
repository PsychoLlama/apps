/**
 * Tests for AlertDialog. Runs in a real browser for the same reasons
 * Dialog's do — it is the same `<dialog>.showModal()` underneath — plus
 * one of its own: opening focus is the platform acting on `autofocus`,
 * which jsdom does not do.
 */

import { fireEvent, render, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { userEvent } from 'vitest/browser';
import AlertDialog, { type AlertDialogProps } from '../alert-dialog';

type Overrides = Partial<
  Omit<AlertDialogProps, 'open' | 'onOpenChange' | 'onAction'>
>;

/**
 * Renders an AlertDialog whose open state the test drives directly.
 * `onOpenChange` only records — nothing syncs it back — so "asked to
 * close" stays distinct from "closed".
 */
const setup = (overrides: Overrides = {}) => {
  const onOpenChange = vi.fn();
  const onAction = vi.fn();
  const [open, setOpen] = createSignal(true);

  const rendered = render(() => (
    <AlertDialog
      title="Delete project"
      description="Northwind is removed for good."
      action="Delete"
      testId="alert"
      {...overrides}
      open={open()}
      onOpenChange={onOpenChange}
      onAction={onAction}
    />
  ));

  const overlay = rendered.container.querySelector('dialog');
  if (!overlay) throw new Error('dialog not found');

  const byTestId = (id: string) => {
    const element = rendered.queryByTestId(id);
    if (!(element instanceof HTMLElement)) throw new Error(`no ${id}`);
    return element;
  };

  return {
    setOpen,
    onOpenChange,
    onAction,
    overlay,
    cancel: () => byTestId('alert-cancel'),
    action: () => byTestId('alert-action'),
    /** The scroll surface around the panel — the click-outside target. */
    outside: () => {
      const scroll = overlay.firstElementChild;
      if (!(scroll instanceof HTMLElement)) throw new Error('no scroll layer');
      return scroll;
    },
  };
};

/** A press-and-release pair, so both ends of the gesture are seen. */
const pressAndRelease = (down: HTMLElement, up: HTMLElement) => {
  fireEvent.pointerDown(down);
  fireEvent.click(up);
};

describe('AlertDialog', () => {
  // --- Accessibility ---

  it('announces itself as an alert dialog', () => {
    const { overlay } = setup();
    expect(overlay).toHaveAttribute('role', 'alertdialog');
  });

  it('describes the stakes', () => {
    const { overlay } = setup();
    const descriptionId = overlay.getAttribute('aria-describedby');

    expect(descriptionId).not.toBeNull();
    expect(overlay.querySelector(`#${descriptionId}`)).toHaveTextContent(
      'Northwind is removed for good.',
    );
  });

  it('opens with the cancelling button focused', async () => {
    const { cancel } = setup();
    await waitFor(() => expect(document.activeElement).toBe(cancel()));
  });

  it('keeps opening focus on cancel even with a focusable body', async () => {
    const { cancel } = setup({
      children: <input data-testid="confirm-name" />,
    });

    await waitFor(() => expect(document.activeElement).toBe(cancel()));
  });

  // Cancel carries `autofocus` too, but the body is earlier in tree
  // order, so the platform's focus delegate reaches it first. That's
  // the documented escape hatch for "type the name to confirm".
  it('yields opening focus to a body control that asks for it', async () => {
    setup({ children: <input autofocus data-testid="confirm-name" /> });

    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute(
        'data-testid',
        'confirm-name',
      ),
    );
  });

  // --- Choices ---

  it('asks to close when the user cancels', () => {
    const { cancel, onOpenChange, onAction } = setup();

    cancel().click();

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onAction).not.toHaveBeenCalled();
  });

  it('reports the choice and then asks to close when the user confirms', () => {
    const { action, onOpenChange, onAction } = setup();

    action().click();

    expect(onAction).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    // The side effect runs first, so a call site that declines the
    // close has already seen the confirmation.
    expect(onAction.mock.invocationCallOrder[0]).toBeLessThan(
      onOpenChange.mock.invocationCallOrder[0],
    );
  });

  it('stays open when the call site declines the close', async () => {
    const { action, overlay } = setup();

    action().click();

    // Nothing syncs `onOpenChange` back, so `open` is still true.
    await waitFor(() => expect(overlay.open).toBe(true));
    expect(overlay.matches(':modal')).toBe(true);
  });

  it('labels the buttons from props', () => {
    const { cancel, action } = setup({
      cancel: 'Keep it',
      action: 'Delete forever',
    });

    expect(cancel()).toHaveTextContent('Keep it');
    expect(action()).toHaveTextContent('Delete forever');
  });

  // --- Dismissal ---

  it('asks to close on Escape', async () => {
    const { overlay, onOpenChange } = setup();

    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Controlled: the DOM state only follows the `open` prop.
    expect(overlay.open).toBe(true);
  });

  it('ignores a click outside the panel', () => {
    const { onOpenChange, outside } = setup();

    pressAndRelease(outside(), outside());

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
