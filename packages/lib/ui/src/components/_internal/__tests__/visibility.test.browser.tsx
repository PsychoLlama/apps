/**
 * Animated-path tests for visibility. Only a real browser runs motion
 * and resolves `Animation.finished`, so the exit hold lives here; the
 * immediate paths are covered in the jsdom suite. The fixtures are
 * presence's: both key their motion off the same `data-state`.
 */

import { render, waitFor } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { createVisibility } from '../visibility';
import * as fixture from './presence.test.browser.css';

const renderHarness = (surfaceClass: string, initiallyOpen: boolean) => {
  const [open, setOpen] = createSignal(initiallyOpen);
  const [element, setElement] = createSignal<HTMLElement>();
  let visible!: () => boolean;

  const rendered = render(() => {
    const visibility = createVisibility({ open, element });
    visible = visibility.visible;

    return (
      <div
        ref={setElement}
        class={surfaceClass}
        data-testid="surface"
        {...visibility.props}
      >
        surface
      </div>
    );
  });

  return {
    setOpen,
    visible: () => visible(),
    surface: () => rendered.getByTestId('surface'),
  };
};

describe('createVisibility (animated)', () => {
  it('plays nothing for a surface that has never opened', () => {
    const { visible, surface } = renderHarness(fixture.animated, false);

    expect(visible()).toBe(false);
    expect(surface()).not.toHaveAttribute('data-state');
    expect(surface().getAnimations()).toHaveLength(0);
  });

  it('stays visible until the exit animation finishes', async () => {
    const { setOpen, visible, surface } = renderHarness(fixture.animated, true);

    setOpen(false);

    // Still visible: the 100ms exit animation is running.
    expect(visible()).toBe(true);
    expect(surface()).toHaveAttribute('data-state', 'closed');

    await waitFor(() => expect(visible()).toBe(false));
    expect(surface()).not.toHaveAttribute('data-state');
  });

  it('stays visible until an exit transition finishes', async () => {
    const { setOpen, visible } = renderHarness(fixture.transitioned, true);

    setOpen(false);

    // Still visible: the 100ms opacity transition is running.
    expect(visible()).toBe(true);

    await waitFor(() => expect(visible()).toBe(false));
  });

  it('ignores an animation that ran the whole time', () => {
    const { setOpen, visible } = renderHarness(fixture.constant, true);

    setOpen(false);
    expect(visible()).toBe(false);
  });

  it('survives an open/close/open flurry mid-exit', async () => {
    const { setOpen, visible, surface } = renderHarness(fixture.animated, true);

    setOpen(false);
    setOpen(true);
    expect(visible()).toBe(true);
    expect(surface()).toHaveAttribute('data-state', 'open');

    // The abandoned exit doesn't put it to rest late.
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(visible()).toBe(true);

    // And a later close still exits.
    setOpen(false);
    await waitFor(() => expect(visible()).toBe(false));
  });

  it('plays the exit again after a full cycle', async () => {
    const { setOpen, visible } = renderHarness(fixture.animated, true);

    setOpen(false);
    await waitFor(() => expect(visible()).toBe(false));

    setOpen(true);
    setOpen(false);
    expect(visible()).toBe(true);
    await waitFor(() => expect(visible()).toBe(false));
  });
});
