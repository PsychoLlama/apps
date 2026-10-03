/**
 * Behavior tests for Tooltip: what shows it and what hides it. Showing
 * is the stylesheet's call off `:focus-visible` and `:hover`, so only a
 * real browser with real input can tell keyboard focus from a pointer
 * press — and only one running layout can show the tether engaging on
 * the box, or the dismissal that rides on the root reporting itself
 * open.
 */

import { For } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import Button from '../../button/button';
import Tooltip, { type TooltipProps } from '../tooltip';
import { __testingFlushCooling } from '../use-exclusive';
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
// enough to open a tooltip the next test never asked to open. And the
// page is one page: a tooltip the last test showed leaves it warm for
// a moment, which would spare the next test's tooltip its wait, so
// it's cooled on the spot.
beforeEach(async () => {
  await userEvent.hover(park);
  __testingFlushCooling();
});

/**
 * A tooltip on a button, after a second button focus can move on to.
 * `triggerClass` styles the button.
 */
const setup = (options: Partial<TooltipProps> = {}, triggerClass?: string) => {
  render(() => (
    <div class={fixture.stage}>
      <Tooltip
        {...options}
        display="inline"
        content="Add to library"
        testId="tooltip"
      >
        {(trigger) => (
          <Button
            as="button"
            testId="trigger"
            class={triggerClass}
            {...trigger}
          >
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

  // --- Grace area ---

  /**
   * Whether a point lands on the window, which is what the grace area
   * is: a pseudo-element hit-tests as the element wearing it. Read by
   * hit test so the shape can be probed without moving the pointer,
   * since moving it is what reshapes the strip.
   */
  const onWindow = (window: HTMLElement, left: number, top: number) => {
    const hit = document.elementFromPoint(left, top);

    return hit !== null && window.contains(hit);
  };

  /**
   * The gap the strip spans, for a window bound below its trigger, and
   * a way to probe it: `across(from, to)` is where a pointer crossing
   * from one point along the edge to another is halfway over, which is
   * what the strip has to hold.
   *
   * Halfway rather than at either end, because the strip's sides are
   * the straight paths between its ends' corners: probing a corner
   * itself lands on the line, and a pixel off it, in the part a
   * trapezoid cuts away.
   */
  const gap = (trigger: HTMLElement) => {
    const anchor = trigger.getBoundingClientRect();
    const surface = screen
      .getByTestId('tooltip-surface')
      .getBoundingClientRect();

    const across = (from: number, to: number) => ({
      left: (from + to) / 2,
      top: (anchor.bottom + surface.top) / 2,
    });

    return {
      anchor,
      surface,
      across,
      center: surface.left + surface.width / 2,
    };
  };

  /**
   * Wait out the window's arrival. It travels on `transform`, so the
   * surface measures short until it has landed, and the strip takes no
   * pointer until then either.
   */
  const arrived = async (window: HTMLElement) => {
    await waitFor(() => expect(window).toHaveAttribute('data-tethered'));
    await Promise.all(
      window
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
  };

  /** How far in from the trigger's ends the probes aim. */
  const INSET = 24;

  it('aims the strip at the pointer on the way over', async () => {
    const { trigger, window } = setup({ side: 'bottom' }, fixture.wide);

    // Out past the window's start, which a strip no wider than the
    // window couldn't reach. Moves are only heard once the tooltip is
    // open, so the pointer settles there after it opens, the way one
    // starting across would.
    await userEvent.hover(trigger, { position: { x: INSET, y: 4 } });
    await arrived(window);
    await userEvent.hover(trigger, { position: { x: INSET, y: 8 } });

    const { anchor, surface, across, center } = gap(trigger);
    const crossing = across(anchor.left + INSET, center);
    expect(crossing.left).toBeLessThan(surface.left);

    await waitFor(() =>
      expect(onWindow(window, crossing.left, crossing.top)).toBe(true),
    );

    // Narrowed onto the pointer, so a crossing from the trigger's other
    // end is off it.
    const elsewhere = across(anchor.right - INSET, center);
    expect(onWindow(window, elsewhere.left, elsewhere.top)).toBe(false);
  });

  it('widens the strip onto the whole trigger on the way back', async () => {
    const { trigger, window } = setup({ side: 'bottom' }, fixture.wide);

    await hover(trigger, window);
    await arrived(window);
    await userEvent.hover(screen.getByTestId('tooltip-surface'));
    expect(window).toHaveAttribute('data-path', 'leave');

    // The pointer is leaving from the surface's middle, and can head for
    // either end of the trigger, though each overhangs the window.
    const { anchor, surface, across, center } = gap(trigger);
    const toStart = across(center, anchor.left + INSET);
    const toEnd = across(center, anchor.right - INSET);
    expect(toStart.left).toBeLessThan(surface.left);
    expect(toEnd.left).toBeGreaterThan(surface.right);

    await waitFor(() =>
      expect(onWindow(window, toStart.left, toStart.top)).toBe(true),
    );
    expect(onWindow(window, toEnd.left, toEnd.top)).toBe(true);

    // The way back leaves as wide as the trigger, which here is wider
    // than the window, so it leaves from all of the window.
    const nearWindow = surface.top - 1;
    expect(onWindow(window, surface.left + 2, nearWindow)).toBe(true);
    expect(onWindow(window, surface.right - 2, nearWindow)).toBe(true);
  });

  it('leaves the window as wide as a smaller trigger', async () => {
    const { trigger, window } = setup({ side: 'bottom' });

    await hover(trigger, window);
    await arrived(window);

    // From the surface's corner, the hard case: a narrow end there would
    // skew the strip into a sliver on its way over to the trigger.
    await userEvent.hover(screen.getByTestId('tooltip-surface'), {
      position: { x: 2, y: 2 },
    });
    expect(window).toHaveAttribute('data-path', 'leave');

    const { anchor, surface } = gap(trigger);
    expect(anchor.width + 8).toBeLessThan(surface.width);

    // Against the window, a band the trigger's width from where the
    // pointer is, and nothing past it.
    const nearWindow = surface.top - 1;
    await waitFor(() =>
      expect(onWindow(window, surface.left + 6, nearWindow)).toBe(true),
    );
    expect(onWindow(window, surface.left + anchor.width - 4, nearWindow)).toBe(
      true,
    );
    expect(onWindow(window, surface.left + anchor.width + 4, nearWindow)).toBe(
      false,
    );
  });

  it('lets the pointer through an unhoverable tooltip', async () => {
    const { trigger, window } = setup({ hoverable: false });

    await hover(trigger, window);

    // Asserted by hit test rather than by moving the pointer there:
    // the driver won't hover something that doesn't take pointer
    // events, which is the very thing under test. Resting on the
    // window, further up, is the same machinery pointing the other way
    // — it moves the pointer onto a hoverable window and the driver
    // allows it — so between them both directions are covered.
    const box = screen.getByTestId('tooltip-surface').getBoundingClientRect();
    const beneath = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    );

    expect(window.contains(beneath)).toBe(false);
  });

  it('catches a press on an unhoverable tooltip focus holds open', async () => {
    const { trigger, window } = setup({ hoverable: false });

    await userEvent.tab();
    await waitFor(() => expect(window).toBeVisible());

    // `park` is what lies under the tooltip, so it's where a press that
    // fell through would land.
    const fellThrough = vi.fn();
    park.addEventListener('click', fellThrough);
    try {
      await userEvent.click(screen.getByTestId('tooltip-surface'));
    } finally {
      park.removeEventListener('click', fellThrough);
    }

    expect(fellThrough).not.toHaveBeenCalled();
    expect(trigger).not.toHaveFocus();
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
    expect(window.getAnimations()).toHaveLength(0);
    expect(window).not.toBeVisible();
  });

  it('starts the wait over on the next visit', async () => {
    const { trigger, window } = setup();

    await userEvent.hover(trigger);
    await userEvent.hover(park);

    // A slow enough visit outlasts the wait and shows, which warms the
    // page and rightly spares the next visit. Cool it so the next visit
    // waits however long this one took.
    __testingFlushCooling();

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

  // --- Entrance ---

  /** The animations on an element that take any time to run. */
  const motionOn = (element: HTMLElement) =>
    element
      .getAnimations()
      .filter(
        (animation) => Number(animation.effect?.getTiming().duration) > 0,
      );

  it('animates a hovered tooltip in', async () => {
    const { trigger, window } = setup();

    await userEvent.hover(trigger);
    expect(motionOn(window)).not.toHaveLength(0);

    // Still arriving once it shows: showing warms the page, which
    // mustn't spare this tooltip the rest of its own entrance.
    await waitFor(() => expect(window).toBeVisible());
    expect(motionOn(window)).not.toHaveLength(0);
  });

  it('shows a focused tooltip without animating it in', async () => {
    const { window } = setup();

    await userEvent.tab();
    expect(motionOn(window)).toHaveLength(0);
  });

  it('slides in out of the side facing the trigger', async () => {
    // Bound below the trigger, in a corner with room to stay there, so
    // the side the animation reads is the side that was asked for.
    const { trigger, window } = setup({ side: 'bottom' });

    await userEvent.hover(trigger);
    expect(window).toHaveAttribute('data-side', 'bottom');

    // The `backwards` fill holds the opening frame for as long as the
    // wait runs, so this reads a still image and not a moving one. The
    // trigger is above, and that's where the window comes from.
    const { m42 } = new DOMMatrix(getComputedStyle(window).transform);
    expect(m42).toBeLessThan(0);
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

  // --- One at a time ---

  /** Three tooltips side by side, in tab order. */
  const setupPair = () => {
    render(() => (
      <div class={fixture.stage}>
        <For each={['first', 'second', 'third']}>
          {(name) => (
            <Tooltip display="inline" content={name} testId={name}>
              {(trigger) => (
                <Button as="button" testId={`${name}-trigger`} {...trigger}>
                  {name}
                </Button>
              )}
            </Tooltip>
          )}
        </For>
      </div>
    ));

    return {
      first: screen.getByTestId('first'),
      second: screen.getByTestId('second'),
      secondTrigger: screen.getByTestId('second-trigger'),
      third: screen.getByTestId('third'),
      thirdTrigger: screen.getByTestId('third-trigger'),
    };
  };

  it('hides a focused tooltip once a hovered one shows', async () => {
    const { first, second, secondTrigger } = setupPair();

    await userEvent.tab();
    expect(first).toBeVisible();

    // The hand-off waits for the newcomer to show, which is at once: the
    // focused one has the page warm.
    await hover(secondTrigger, second);
    expect(first).not.toBeVisible();
    expect(first).toHaveAttribute('data-dismissed');

    // Losing the page doesn't take the newcomer down with it.
    expect(second).toBeVisible();
  });

  it('brings a superseded tooltip back on its next open', async () => {
    const { first, second, secondTrigger } = setupPair();

    await userEvent.tab();
    await hover(secondTrigger, second);

    // Still focused, so the veto holds after the pointer moves on.
    await userEvent.hover(park);
    expect(first).not.toBeVisible();

    // Away and back within the stage. `first` is the first thing on the
    // page that takes focus, so stepping back off it would leave the
    // page, and whether the next step finds its way back in is the
    // browser's business, not ours.
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    expect(first).toBeVisible();
  });

  // --- Skip delay ---

  /** Hover `first` until it has shown. */
  const warmUp = (first: HTMLElement) =>
    hover(screen.getByTestId('first-trigger'), first);

  it('skips the wait for one that follows another', async () => {
    const { first, second, secondTrigger } = setupPair();
    await warmUp(first);

    // By way of somewhere else, briefly: the page stays warm a moment.
    await userEvent.hover(park);
    await userEvent.hover(secondTrigger);
    expect(second).toBeVisible();
  });

  it('waits again once the page has cooled', async () => {
    const { first, second, secondTrigger } = setupPair();
    await warmUp(first);

    await userEvent.hover(park);
    __testingFlushCooling();
    await userEvent.hover(secondTrigger);
    expect(second).not.toBeVisible();
    await waitFor(() => expect(second).toBeVisible());
  });

  it('skips the wait while a focused one is showing', async () => {
    const { second, secondTrigger } = setupPair();

    await userEvent.tab();
    await userEvent.hover(secondTrigger);
    expect(second).toBeVisible();
  });

  it('stays warm through a hand-off for as long as one is up', async () => {
    const { second, secondTrigger, third, thirdTrigger } = setupPair();

    // The focused one gives way to the hovered one, and hiding doesn't
    // start the page cooling while its successor is still showing.
    await userEvent.tab();
    await hover(secondTrigger, second);
    __testingFlushCooling();

    await userEvent.hover(thirdTrigger);
    expect(third).toBeVisible();
  });

  it("doesn't warm from a pointer passing over", async () => {
    const { second, secondTrigger } = setupPair();

    await userEvent.hover(screen.getByTestId('first-trigger'));
    await userEvent.hover(secondTrigger);
    expect(second).not.toBeVisible();
  });

  it("doesn't warm from a dismissed one", async () => {
    const { first, second, secondTrigger } = setupPair();

    await userEvent.tab();
    await userEvent.keyboard('{Escape}');
    expect(first).not.toBeVisible();

    __testingFlushCooling();
    await userEvent.hover(secondTrigger);
    expect(second).not.toBeVisible();
  });
});
