/**
 * Behavior tests for Tooltip: what shows it and what hides it. Showing
 * is the stylesheet's call off `:focus-visible` and `:hover`, so only a
 * real browser with real input can tell keyboard focus from a pointer
 * press — and only one running layout can show the tether engaging on
 * the box, or the dismissal that rides on the root reporting itself
 * open.
 */

import { render, screen, waitFor } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import Button from '../../button/button';
import Tooltip from '../tooltip';
import * as fixture from './tooltip.test.browser.css';

/**
 * Where the pointer waits. Outside the rendered tree, so it survives
 * the cleanup between tests, and under it, so a tooltip is never what
 * the pointer lands on.
 */
let park: HTMLElement;

beforeAll(() => {
  park = document.createElement('div');
  park.className = fixture.park;
  document.body.prepend(park);
});

afterAll(() => {
  park.remove();
});

// The pointer is real and stays where the last test left it, which is
// enough to open a tooltip the next test never asked to open.
beforeEach(() => userEvent.hover(park));

/** A tooltip on a button, after a second button focus can move on to. */
const setup = () => {
  render(() => (
    <div class={fixture.stage}>
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
    </div>
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

  it('engages the tether while shown and lets go when hidden', async () => {
    const { window } = setup();

    await userEvent.tab();
    await waitFor(() => expect(window).toHaveAttribute('data-tethered'));

    await userEvent.tab();
    await waitFor(() => expect(window).not.toHaveAttribute('data-tethered'));
  });

  // --- Hover ---

  /** Rest the pointer on something and wait out the delay. */
  const hover = async (target: HTMLElement, window: HTMLElement) => {
    await userEvent.hover(target);
    await waitFor(() => expect(window).toBeVisible());
  };

  it('shows while the pointer rests on the trigger', async () => {
    const { trigger, window } = setup();

    await hover(trigger, window);

    await userEvent.hover(park);
    expect(window).not.toBeVisible();
  });

  it('opens on hover without focusing the trigger', async () => {
    const { trigger, window } = setup();

    await hover(trigger, window);
    expect(trigger).not.toHaveFocus();
  });

  it('stays open while the pointer rests on the window itself', async () => {
    const { trigger, window } = setup();

    await hover(trigger, window);
    // The window sits inside the root, so it's still the root under the
    // pointer. Crossing the gap between the two isn't covered — that
    // wants a grace area.
    await userEvent.hover(window);
    expect(window).toBeVisible();

    await userEvent.hover(park);
    expect(window).not.toBeVisible();
  });

  // --- Delay ---

  it('makes a hover wait before showing anything', async () => {
    const { trigger, window } = setup();

    await userEvent.hover(trigger);
    // The pointer has landed and the stylesheet has already decided the
    // tooltip is open — the window is just holding itself back.
    expect(window).not.toBeVisible();

    await waitFor(() => expect(window).toBeVisible());
  });

  it('abandons the wait when the pointer leaves first', async () => {
    const { trigger, window } = setup();

    await userEvent.hover(trigger);
    await userEvent.hover(park);

    // Nothing is left running to fire late.
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(window).not.toBeVisible();
  });

  it('starts the wait over on the next visit', async () => {
    const { trigger, window } = setup();

    await userEvent.hover(trigger);
    await userEvent.hover(park);

    await userEvent.hover(trigger);
    expect(window).not.toBeVisible();
    await waitFor(() => expect(window).toBeVisible());
  });

  it('shows a focus open without waiting', async () => {
    const { trigger, window } = setup();

    await userEvent.tab();
    // No `waitFor`: the assertion is that there was nothing to wait for.
    expect(trigger).toHaveFocus();
    expect(window).toBeVisible();
  });

  it('cuts the wait short when focus lands mid-wait', async () => {
    const { trigger, window } = setup();

    await userEvent.hover(trigger);
    expect(window).not.toBeVisible();

    // Assumes tabbing is quicker than the wait, which it is by orders
    // of magnitude. Asserting that with the clock would only make the
    // test flaky.
    await userEvent.tab();
    expect(trigger).toHaveFocus();
    expect(window).toBeVisible();
  });

  it('stays hidden once a pointer press has moved on', async () => {
    const { trigger, window } = setup();

    // The press leaves focus on the trigger. `:focus-visible` declines
    // it, so with the pointer gone there's nothing holding it open.
    await userEvent.click(trigger);
    await userEvent.hover(park);

    expect(trigger).toHaveFocus();
    expect(window).not.toBeVisible();
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

  it('holds a hover dismissal until the pointer leaves', async () => {
    const { trigger, window } = setup();
    await hover(trigger, window);

    await userEvent.keyboard('{Escape}');
    expect(window).not.toBeVisible();

    // Still under the pointer, so the stylesheet still wants it open
    // and the veto is what's hiding it. Leaving lifts the veto.
    await userEvent.hover(park);
    await hover(trigger, window);
  });

  it('dismisses on a press on the hovered trigger', async () => {
    const { trigger, window } = setup();
    await hover(trigger, window);

    await userEvent.click(trigger);
    expect(window).not.toBeVisible();

    await userEvent.hover(park);
    await hover(trigger, window);
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

  it('dismisses when the trigger is activated', async () => {
    const { window } = setup();
    await opened(window);

    // Enter on a focused button arrives as a click on it.
    await userEvent.keyboard('{Enter}');
    expect(window).not.toBeVisible();
  });

  it('dismisses on a press outside the window', async () => {
    const { window } = setup();
    await opened(window);

    await userEvent.click(park);
    expect(window).not.toBeVisible();
  });

  it('dismisses on a press that holds focus', async () => {
    // The press above dismisses either way, because it blurs the
    // trigger. This is the one the listener is actually for: a target
    // that prevents the default to keep focus where it is, the way a
    // menu or a toolbar does.
    render(() => (
      <>
        <div class={fixture.stage}>
          <Tooltip display="inline" content="Add to library" testId="tooltip">
            {(trigger) => (
              <Button as="button" testId="trigger" {...trigger}>
                Add
              </Button>
            )}
          </Tooltip>
        </div>
        <div
          class={fixture.outside}
          data-testid="guard"
          onPointerDown={(event) => event.preventDefault()}
          onMouseDown={(event) => event.preventDefault()}
        >
          holds focus
        </div>
      </>
    ));
    const window = screen.getByTestId('tooltip');
    await opened(window);

    await userEvent.click(screen.getByTestId('guard'));
    expect(screen.getByTestId('trigger')).toHaveFocus();
    expect(window).not.toBeVisible();
  });

  it('dismisses when the trigger scrolls', async () => {
    render(() => (
      <div class={fixture.stage}>
        <div class={fixture.scroller} data-testid="scroller">
          <Tooltip display="inline" content="Add to library" testId="tooltip">
            {(trigger) => (
              <Button as="button" testId="trigger" {...trigger}>
                Add
              </Button>
            )}
          </Tooltip>
          <div class={fixture.filler} />
        </div>
      </div>
    ));
    const window = screen.getByTestId('tooltip');
    await opened(window);

    // Assigning `scrollTop` raises the same event a wheel would, which
    // is what the listener reads; it doesn't exercise the gesture.
    screen.getByTestId('scroller').scrollTop = 20;
    await waitFor(() => expect(window).not.toBeVisible());
  });

  it('listens for nothing while closed', async () => {
    const { window } = setup();

    // Dismissing a closed tooltip would leave the veto set, and the
    // next focus would find it hidden.
    await userEvent.keyboard('{Escape}');
    await userEvent.click(park);

    await opened(window);
    expect(window).toBeVisible();
  });
});
