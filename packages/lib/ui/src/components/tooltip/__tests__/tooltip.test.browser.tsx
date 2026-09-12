/**
 * Behavior tests for Tooltip: what shows it and what hides it. Showing
 * is the stylesheet's call off `:focus-visible`, so only a real browser
 * with real input can tell keyboard focus from a pointer press — and
 * only one running layout can show the tether engaging on the box.
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
});
