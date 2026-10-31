/**
 * Behavior tests for Popover: what it tells assistive tech, what opens
 * and closes it, and where focus goes. A real browser, since focus is
 * aimed by visibility and the exit waits on real motion.
 */

import { createSignal, type JSX } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import Button from '../../button/button';
import Dialog from '../../dialog/dialog';
import Popover from '../popover';
import * as fixture from './popover.test.browser.css';

/** A field to land focus on. */
const Field = () => <input aria-label="Email" data-testid="email" />;

/**
 * A popover on a button, before a second button that sits outside it.
 * The state is the test's own, so every `onOpenChange` takes effect.
 */
const setup = (content: JSX.Element = <Field />) => {
  const onOpenChange = vi.fn<(open: boolean) => void>();
  const [open, setOpen] = createSignal(false);

  render(() => (
    <>
      <Popover
        display="block"
        testId="popover"
        aria-label="Share"
        content={content}
        open={open()}
        onOpenChange={(next) => {
          onOpenChange(next);
          setOpen(next);
        }}
      >
        {(trigger) => (
          <Button as="button" testId="trigger" {...trigger}>
            Share
          </Button>
        )}
      </Popover>
      <Button as="button" testId="outside" class={fixture.outside}>
        Outside
      </Button>
    </>
  ));

  return {
    trigger: screen.getByTestId('trigger'),
    outside: screen.getByTestId('outside'),
    window: () => screen.queryByTestId('popover'),
    surface: () => screen.queryByTestId('popover-surface'),
    onOpenChange,
  };
};

/** Open from the trigger and wait for the surface to take focus. */
const open = async (trigger: HTMLElement) => {
  await userEvent.click(trigger);
  await waitFor(() =>
    expect(screen.getByTestId('popover-surface')).toContainElement(
      document.activeElement as HTMLElement,
    ),
  );
};

/** Wait out the exit, until the window leaves the page. */
const closed = () =>
  waitFor(() => expect(screen.queryByTestId('popover')).toBeNull());

describe('Popover', () => {
  // --- Accessibility ---

  it('starts closed, with nothing to control', () => {
    const { trigger, window } = setup();

    expect(window()).toBeNull();
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-controls');
  });

  it('opens a named dialog the trigger controls', async () => {
    const { trigger, surface } = setup();

    await open(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Share' });
    expect(dialog).toBe(surface());
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', dialog.id);
  });

  // --- Trigger ---

  it('toggles from the trigger, returning focus to it', async () => {
    const { trigger, onOpenChange } = setup();

    await open(trigger);
    await userEvent.click(trigger);

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(trigger).toHaveFocus();
    await closed();
  });

  // --- Initial focus ---

  it('focuses the first tabbable element inside', async () => {
    const { trigger } = setup();

    await open(trigger);
    expect(screen.getByTestId('email')).toHaveFocus();
  });

  it('prefers an autofocus element', async () => {
    const { trigger } = setup(
      <>
        <Field />
        <button data-testid="preferred" autofocus>
          Preferred
        </button>
      </>,
    );

    await open(trigger);
    expect(screen.getByTestId('preferred')).toHaveFocus();
  });

  it('skips links', async () => {
    const { trigger } = setup(
      <>
        <a href="#docs">Docs</a>
        <Field />
      </>,
    );

    await open(trigger);
    expect(screen.getByTestId('email')).toHaveFocus();
  });

  it('focuses the surface when nothing inside is tabbable', async () => {
    const { trigger, surface } = setup(<p>Nothing to focus.</p>);

    await open(trigger);
    expect(surface()).toHaveFocus();
  });

  // --- Escape ---

  it('closes on Escape, returning focus to the trigger', async () => {
    const { trigger, onOpenChange } = setup();

    await open(trigger);
    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(trigger).toHaveFocus();
    await closed();
  });

  it('leaves an Escape something inside already claimed', async () => {
    const { trigger, onOpenChange } = setup(
      <input
        aria-label="Search"
        onKeyDown={(event) => {
          if (event.key === 'Escape') event.preventDefault();
        }}
      />,
    );

    await open(trigger);
    onOpenChange.mockClear();
    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('takes Escape from a dialog around it', async () => {
    const onDialogChange = vi.fn();

    render(() => {
      const [open, setOpen] = createSignal(false);

      return (
        <Dialog
          title="Edit profile"
          testId="dialog"
          open
          onOpenChange={onDialogChange}
        >
          <Popover
            display="block"
            testId="popover"
            aria-label="Share"
            content={<Field />}
            open={open()}
            onOpenChange={setOpen}
          >
            {(trigger) => (
              <Button as="button" testId="trigger" {...trigger}>
                Share
              </Button>
            )}
          </Popover>
        </Dialog>
      );
    });

    const trigger = screen.getByTestId('trigger');
    await open(trigger);
    await userEvent.keyboard('{Escape}');

    await closed();
    expect(onDialogChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('dialog')).toBeVisible();
  });

  // --- Outside ---

  it('closes on a press outside, leaving focus where it landed', async () => {
    const { trigger, outside, onOpenChange } = setup();

    await open(trigger);
    await userEvent.click(outside);

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(outside).toHaveFocus();
    await closed();
  });

  it('stays open on a press inside', async () => {
    const { trigger, surface, onOpenChange } = setup();

    await open(trigger);
    onOpenChange.mockClear();
    await userEvent.click(surface()!);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('waits for a touch outside to become a tap', async () => {
    const { trigger, outside, onOpenChange } = setup();

    await open(trigger);
    onOpenChange.mockClear();

    // A touch may be the start of a scroll, which never clicks.
    outside.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }),
    );
    expect(onOpenChange).not.toHaveBeenCalled();

    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('closes when Tab leaves it, leaving focus on the next stop', async () => {
    const { trigger, outside, onOpenChange } = setup();

    await open(trigger);
    await userEvent.tab();

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(outside).toHaveFocus();
    await closed();
  });

  it('stays open when Shift+Tab returns to the trigger', async () => {
    const { trigger, onOpenChange } = setup();

    await open(trigger);
    onOpenChange.mockClear();
    await userEvent.tab({ shift: true });

    expect(trigger).toHaveFocus();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // --- Motion ---

  it('reopens with focus inside, however far the exit got', async () => {
    const { trigger, window } = setup();

    await open(trigger);
    await userEvent.click(trigger);
    await userEvent.click(trigger);

    await waitFor(() => expect(window()).toHaveAttribute('data-state', 'open'));
    expect(screen.getByTestId('email')).toHaveFocus();
  });
});
