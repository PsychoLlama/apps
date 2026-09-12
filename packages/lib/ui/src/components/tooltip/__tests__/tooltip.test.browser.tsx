/**
 * Behavior tests for Tooltip: what shows it and what hides it. Showing
 * is the stylesheet's call off `:focus-visible`, so only a real browser
 * with real input can tell keyboard focus from a pointer press — and
 * only one running layout can show the tether engaging on the box, or
 * the dismissal that rides on the root reporting itself open.
 */

import { render, screen, waitFor } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import Button from '../../button/button';
import Tooltip from '../tooltip';

/** A tooltip on a button, after a second button focus can move on to. */
const setup = () => {
  render(() => (
    <>
      <Tooltip display="inline" content="Add to library" testId="tooltip">
        {(trigger) => (
          <Button as="button" testId="trigger" {...trigger}>
            Add
          </Button>
        )}
      </Tooltip>
      <Button as="button" testId="next">
        Next
      </Button>
    </>
  ));

  return {
    trigger: screen.getByTestId('trigger'),
    window: screen.getByTestId('tooltip'),
  };
};

describe('Tooltip', () => {
  it('starts hidden', () => {
    const { window } = setup();

    expect(window).not.toBeVisible();
    expect(window).not.toHaveAttribute('data-tethered');
  });

  it('shows while keyboard focus rests on the trigger', async () => {
    const { trigger, window } = setup();

    await userEvent.tab();
    expect(trigger).toHaveFocus();
    expect(window).toBeVisible();

    await userEvent.tab();
    expect(trigger).not.toHaveFocus();
    expect(window).not.toBeVisible();
  });

  it('stays hidden when a pointer press focuses the trigger', async () => {
    const { trigger, window } = setup();

    await userEvent.click(trigger);
    expect(trigger).toHaveFocus();
    expect(window).not.toBeVisible();
  });

  it('engages the tether while shown and lets go when hidden', async () => {
    const { window } = setup();

    await userEvent.tab();
    await waitFor(() => expect(window).toHaveAttribute('data-tethered'));

    await userEvent.tab();
    await waitFor(() => expect(window).not.toHaveAttribute('data-tethered'));
  });

  // --- Dismissal ---

  /** Tab to the trigger and wait for the window to report itself open. */
  const opened = async (window: HTMLElement) => {
    await userEvent.tab();
    await waitFor(() => expect(window).toHaveAttribute('data-tethered'));
  };

  it('dismisses on Escape and stays put until focus leaves', async () => {
    const { trigger, window } = setup();
    await opened(window);

    await userEvent.keyboard('{Escape}');
    expect(window).not.toBeVisible();
    expect(trigger).toHaveFocus();

    // Not a close: focus is still resting on the trigger, so a second
    // Escape has nothing to do and the tooltip doesn't come back.
    await userEvent.keyboard('{Escape}');
    expect(window).not.toBeVisible();

    await userEvent.tab();
    await userEvent.tab({ shift: true });
    expect(trigger).toHaveFocus();
    expect(window).toBeVisible();
  });

  it('lets the tether go while dismissed', async () => {
    const { window } = setup();
    await opened(window);

    // A dismissed window is out of layout; there's nothing to measure
    // and nowhere to put the answer.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(window).not.toHaveAttribute('data-tethered'));

    await userEvent.tab();
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(window).toHaveAttribute('data-tethered'));
  });

  it('listens for nothing while closed', async () => {
    const { window } = setup();

    // Dismissing a closed tooltip would leave the veto set, and the
    // next focus would find it hidden.
    await userEvent.keyboard('{Escape}');

    await opened(window);
    expect(window).toBeVisible();
  });
});
