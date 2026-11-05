/**
 * Behavior tests for HoverCard: what opens and closes it, how long it
 * waits, what holds it up, and that the tether only runs while it's on
 * screen. A real
 * browser, since hover, `:focus-visible`, and exit motion are all real.
 */

import { render, screen, waitFor } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import HoverCard from '../hover-card';

/** Longer than either delay, so a settled state has had time to land. */
const SETTLE = 400;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A hover card on a link, with a link inside it, after a button that
 * sits outside it. The card hangs below its trigger, clear of the
 * button.
 */
const setup = () => {
  render(() => (
    <>
      <button type="button" data-testid="outside">
        Outside
      </button>
      <HoverCard
        display="block"
        testId="card"
        content={
          <a href="#profile" data-testid="inner">
            Profile
          </a>
        }
      >
        <a href="#user" data-testid="trigger">
          @user
        </a>
      </HoverCard>
    </>
  ));

  return {
    outside: screen.getByTestId('outside'),
    trigger: screen.getByTestId('trigger'),
    inner: screen.getByTestId('inner'),
    window: screen.getByTestId('card'),
    surface: screen.getByTestId('card-surface'),
  };
};

const shown = (element: HTMLElement) =>
  waitFor(() => expect(element).toBeVisible());

const hidden = (element: HTMLElement) =>
  waitFor(() => expect(element).not.toBeVisible());

/** Hover the trigger and wait for the card. */
const openByHover = async ({
  trigger,
  surface,
}: Pick<ReturnType<typeof setup>, 'trigger' | 'surface'>) => {
  await userEvent.hover(trigger);
  await shown(surface);
};

/**
 * One half of a mouse press. The driver only clicks whole, and these
 * tests need the pointer to travel between the two halves.
 */
const press = (target: EventTarget, type: 'pointerdown' | 'pointerup') =>
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, pointerType: 'mouse' }),
  );

describe('HoverCard', () => {
  // --- At rest ---

  it('starts hidden, at rest, and untethered', () => {
    const { window, surface } = setup();

    expect(surface).not.toBeVisible();
    expect(window).not.toHaveAttribute('data-state');
    expect(window).not.toHaveAttribute('data-tethered');
  });

  // --- Pointer ---

  it('opens on hover after a delay', async () => {
    const { trigger, window, surface } = setup();

    await userEvent.hover(trigger);
    expect(surface).not.toBeVisible();

    await shown(surface);
    expect(window).toHaveAttribute('data-state', 'open');
    await waitFor(() => expect(window).toHaveAttribute('data-tethered'));
  });

  it('never opens for a visit shorter than the delay', async () => {
    const { trigger, outside, surface } = setup();

    await userEvent.hover(trigger);
    await userEvent.hover(outside);
    await wait(SETTLE);

    expect(surface).not.toBeVisible();
  });

  it('closes after a delay once the pointer leaves', async () => {
    const { trigger, outside, window, surface } = setup();

    await userEvent.hover(trigger);
    await shown(surface);

    await userEvent.hover(outside);
    expect(surface).toBeVisible();

    await hidden(surface);
    expect(window).not.toHaveAttribute('data-state');
    expect(window).not.toHaveAttribute('data-tethered');
  });

  it('stays open while the pointer moves onto the card', async () => {
    const { trigger, surface } = setup();

    await userEvent.hover(trigger);
    await shown(surface);

    await userEvent.hover(surface);
    await wait(SETTLE);

    expect(surface).toBeVisible();
  });

  it('stays open when the pointer returns within the close delay', async () => {
    const { trigger, outside, surface } = setup();

    await userEvent.hover(trigger);
    await shown(surface);

    await userEvent.hover(outside);
    // Straight back: waiting for the card to look stable would outlast
    // the delay being tested.
    await userEvent.hover(surface, { force: true });
    await wait(SETTLE);

    expect(surface).toBeVisible();
  });

  // --- Keyboard ---
  //
  // The pointer stays wherever the last test left it, which can be over
  // this test's card. Each starts by parking it outside.

  it('opens on keyboard focus after a delay', async () => {
    const { trigger, outside, surface } = setup();
    await userEvent.hover(outside);

    await userEvent.tab(); // Outside.
    await userEvent.tab();
    expect(trigger).toHaveFocus();
    expect(surface).not.toBeVisible();

    await shown(surface);
  });

  it('stays open while focus moves into the card', async () => {
    const { inner, outside, surface } = setup();
    await userEvent.hover(outside);

    await userEvent.tab();
    await userEvent.tab();
    await shown(surface);

    await userEvent.tab();
    expect(inner).toHaveFocus();
    await wait(SETTLE);

    expect(surface).toBeVisible();
  });

  it('closes once focus leaves the card', async () => {
    const { trigger, outside, surface } = setup();
    await userEvent.hover(outside);

    await userEvent.tab();
    await userEvent.tab();
    await shown(surface);

    await userEvent.tab({ shift: true }); // Back out to Outside.
    expect(trigger).not.toHaveFocus();

    await hidden(surface);
  });

  // --- Dismissal ---

  it('closes on Escape at once, and stays closed while hovered', async () => {
    const { trigger, outside, surface } = setup();
    await openByHover({ trigger, surface });

    await userEvent.keyboard('{Escape}');
    await hidden(surface);

    await wait(SETTLE);
    expect(surface).not.toBeVisible();

    // The next visit reopens it.
    await userEvent.hover(outside);
    await openByHover({ trigger, surface });
  });

  it('closes on a press outside', async () => {
    const { trigger, outside, surface } = setup();
    await openByHover({ trigger, surface });

    await userEvent.click(outside);

    await hidden(surface);
  });

  it('stays open when focus leaves while the pointer rests on it', async () => {
    const { trigger, outside, surface } = setup();
    await userEvent.hover(outside);

    await userEvent.tab();
    await userEvent.tab();
    await shown(surface);
    await userEvent.hover(surface);

    await userEvent.tab({ shift: true });
    await wait(SETTLE);

    expect(trigger).not.toHaveFocus();
    expect(surface).toBeVisible();
  });

  // --- Holds ---

  it('stays open while a press on it is held, then lets go', async () => {
    const { trigger, outside, surface } = setup();
    await openByHover({ trigger, surface });

    press(surface, 'pointerdown');
    await userEvent.hover(outside);
    await wait(SETTLE);
    expect(surface).toBeVisible();

    press(document, 'pointerup');
    await hidden(surface);
  });

  it('stays open while a selection reaches into it', async () => {
    const { trigger, outside, inner, surface } = setup();
    await openByHover({ trigger, surface });

    document.getSelection()?.selectAllChildren(inner);
    await userEvent.hover(outside);
    await wait(SETTLE);
    expect(surface).toBeVisible();

    // Clearing the selection lets the card go like any other exit.
    document.getSelection()?.removeAllRanges();
    await hidden(surface);
  });
});
