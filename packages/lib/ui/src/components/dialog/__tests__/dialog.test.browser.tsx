/**
 * Tests for Dialog. Runs in a real browser via `@vitest/browser` because
 * the component is built on `<dialog>.showModal()` — top-layer
 * promotion, the `cancel` event, and the focus trap are all UA behavior
 * jsdom doesn't implement — and because presence holds the close until
 * the exit animation resolves, which needs a real timeline.
 */

import { fireEvent, render, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { userEvent } from 'vitest/browser';
import Dialog, { type DialogProps } from '../dialog';

type Overrides = Partial<Omit<DialogProps, 'open' | 'onOpenChange'>>;

/**
 * Renders a Dialog whose open state the test drives directly.
 * `onOpenChange` only records — nothing syncs it back — so every
 * assertion about "asked to close" stays distinct from "closed".
 */
const setup = (overrides: Overrides = {}) => {
  const onOpenChange = vi.fn();
  const [open, setOpen] = createSignal(true);

  const rendered = render(() => (
    <Dialog
      title="Edit profile"
      testId="dialog"
      {...overrides}
      open={open()}
      onOpenChange={onOpenChange}
    >
      <button type="button" data-testid="save">
        Save
      </button>
    </Dialog>
  ));

  const overlay = rendered.container.querySelector('dialog');
  if (!overlay) throw new Error('dialog not found');

  return {
    setOpen,
    onOpenChange,
    overlay,
    panel: () => rendered.queryByTestId('dialog'),
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

describe('Dialog', () => {
  // --- Mounting ---

  it('shows the dialog modally while open', () => {
    const { overlay, panel } = setup();

    expect(overlay.open).toBe(true);
    expect(overlay.matches(':modal')).toBe(true);
    expect(panel()).not.toBeNull();
  });

  it('stays closed and keeps the body unmounted', () => {
    const { setOpen, overlay, panel } = setup();

    setOpen(false);
    expect(panel()).not.toBeNull(); // held for the exit animation

    return waitFor(() => {
      expect(overlay.open).toBe(false);
      expect(panel()).toBeNull();
    });
  });

  it('reopens after a close settles', async () => {
    const { setOpen, overlay, panel } = setup();

    setOpen(false);
    await waitFor(() => expect(overlay.open).toBe(false));

    setOpen(true);
    expect(overlay.open).toBe(true);
    expect(panel()).not.toBeNull();
  });

  it('survives reopening mid-exit', async () => {
    const { setOpen, overlay, panel } = setup();

    setOpen(false);
    setOpen(true);

    expect(overlay.open).toBe(true);
    await waitFor(() => expect(overlay).toHaveAttribute('data-state', 'open'));
    expect(panel()).not.toBeNull();
  });

  // --- Accessibility ---

  it('names the dialog with its title', () => {
    const { overlay } = setup();
    const titleId = overlay.getAttribute('aria-labelledby');

    expect(titleId).not.toBeNull();
    expect(overlay.querySelector(`#${titleId}`)).toHaveTextContent(
      'Edit profile',
    );
  });

  it('describes the dialog with its description', () => {
    const { overlay } = setup({ description: 'Changes apply immediately.' });
    const descriptionId = overlay.getAttribute('aria-describedby');

    expect(descriptionId).not.toBeNull();
    expect(overlay.querySelector(`#${descriptionId}`)).toHaveTextContent(
      'Changes apply immediately.',
    );
  });

  it('omits the description wiring when there is none', () => {
    const { overlay } = setup();
    expect(overlay).not.toHaveAttribute('aria-describedby');
  });

  it('moves focus into the dialog', async () => {
    setup();
    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute('data-testid', 'save'),
    );
  });

  // --- Dismissal ---

  it('asks to close on Escape without closing itself', async () => {
    const { overlay, onOpenChange } = setup();

    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // Controlled: the DOM state only follows the `open` prop.
    expect(overlay.open).toBe(true);
  });

  it('ignores Escape when not dismissible', async () => {
    const { overlay, onOpenChange } = setup({ dismissible: false });

    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(overlay.open).toBe(true);
  });

  it('asks to close on a click outside the panel', () => {
    const { onOpenChange, outside } = setup();

    pressAndRelease(outside(), outside());

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('ignores a click inside the panel', () => {
    const { onOpenChange, panel } = setup();
    const surface = panel();
    if (!surface) throw new Error('panel not found');

    pressAndRelease(surface, surface);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('ignores a press that started inside the panel', () => {
    const { onOpenChange, panel, outside } = setup();
    const surface = panel();
    if (!surface) throw new Error('panel not found');

    // A text selection dragged out of the panel and released on the
    // backdrop must not dismiss.
    pressAndRelease(surface, outside());

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('ignores an outside click when not dismissible', () => {
    const { onOpenChange, outside } = setup({ dismissible: false });

    pressAndRelease(outside(), outside());

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // --- Native closes ---
  //
  // A `<form method="dialog">` submit closes the element before any
  // handler runs, so the DOM briefly disagrees with `open`.

  it('reports a native close as a close request', async () => {
    const { overlay, onOpenChange } = setup();

    // The `close` event lands in a later task than `close()` itself.
    overlay.close();

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('reopens after a native close the call site declined', async () => {
    // `onOpenChange` never syncs back, so `open` stays true — the DOM
    // has to follow the prop, not the submit.
    const { overlay } = setup();

    overlay.close();

    await waitFor(() => expect(overlay.open).toBe(true));
    expect(overlay.matches(':modal')).toBe(true);
  });

  // Escape isn't user activation, so a run of presses spends the
  // document's history-action activation and the UA starts sending
  // `cancel` non-cancelable, then closes regardless.
  const forceDismiss = (overlay: HTMLDialogElement) => {
    overlay.dispatchEvent(new Event('cancel', { cancelable: false }));
    overlay.close();
  };

  it('puts a forced dismissal back when the call site declines', async () => {
    const { overlay, onOpenChange } = setup();

    forceDismiss(overlay);

    // Offered once, by `cancel` — not a second time by `close`.
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(overlay.open).toBe(true));
    expect(overlay.matches(':modal')).toBe(true);
  });

  // Reopening is a fresh mount, so the entrance keyframes would replay
  // on every press. The stylesheet keys off `data-restored` to sit that
  // one out.
  it('does not replay the entrance when it puts itself back', async () => {
    const { overlay } = setup();

    forceDismiss(overlay);

    await waitFor(() => expect(overlay.open).toBe(true));
    expect(overlay).toHaveAttribute('data-restored');
  });

  it('animates in again on the next real open', async () => {
    const { setOpen, overlay } = setup();

    forceDismiss(overlay);
    await waitFor(() => expect(overlay).toHaveAttribute('data-restored'));

    setOpen(false);
    await waitFor(() => expect(overlay.open).toBe(false));
    setOpen(true);

    expect(overlay).not.toHaveAttribute('data-restored');
  });

  it('holds a forced dismissal off a dialog that is not dismissible', async () => {
    const { overlay, onOpenChange } = setup({ dismissible: false });

    forceDismiss(overlay);

    expect(onOpenChange).not.toHaveBeenCalled();
    await waitFor(() => expect(overlay.open).toBe(true));
    expect(overlay.matches(':modal')).toBe(true);
  });

  it('stays closed after a native close the call site accepted', async () => {
    const { setOpen, overlay, panel } = setup();

    overlay.close();
    setOpen(false);

    await waitFor(() => expect(panel()).toBeNull());
    expect(overlay.open).toBe(false);
  });
});
