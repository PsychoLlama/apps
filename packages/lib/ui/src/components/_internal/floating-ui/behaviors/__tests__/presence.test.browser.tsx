/**
 * Animated-path tests for presence. Only a real browser computes
 * `animation-name` and fires `animationend`, so the exit-hold behavior
 * lives here; the immediate paths are covered in the jsdom suite.
 */

import { render, waitFor } from '@solidjs/testing-library';
import { Show, createSignal } from 'solid-js';
import { createPresence } from '../presence';
import * as fixture from './presence.test.browser.css';

/** A presence-managed surface whose open state the test drives. */
const Harness = (props: { surfaceClass: string; open: () => boolean }) => {
  const [element, setElement] = createSignal<HTMLElement | null>(null);
  const mounted = createPresence({
    open: () => props.open(),
    element,
  });

  return (
    <Show when={mounted()}>
      <div
        ref={setElement}
        class={props.surfaceClass}
        data-state={props.open() ? 'open' : 'closed'}
        data-testid="surface"
      >
        surface
      </div>
    </Show>
  );
};

const renderHarness = (surfaceClass: string) => {
  const [open, setOpen] = createSignal(true);
  const rendered = render(() => (
    <Harness surfaceClass={surfaceClass} open={open} />
  ));

  return { setOpen, query: () => rendered.queryByTestId('surface') };
};

describe('createPresence (animated)', () => {
  it('holds the mount until the exit animation finishes', async () => {
    const { setOpen, query } = renderHarness(fixture.animated);
    expect(query()).not.toBeNull();

    setOpen(false);
    // Still mounted: the 100ms exit animation is running.
    expect(query()).not.toBeNull();

    await waitFor(() => expect(query()).toBeNull());
  });

  it('unmounts immediately when closing applies no animation', async () => {
    const { setOpen, query } = renderHarness(fixture.entranceOnly);
    // Let the entrance animation finish so it can't be mistaken for
    // exit motion.
    await new Promise((resolve) => setTimeout(resolve, 100));

    setOpen(false);
    expect(query()).toBeNull();
  });

  it('ignores an animation that ran the whole time', () => {
    // A 10s ambient animation is still mid-flight at close; presence
    // must recognize it isn't exit motion and unmount at once.
    const { setOpen, query } = renderHarness(fixture.constant);

    setOpen(false);
    expect(query()).toBeNull();
  });

  it('survives an open/close/open flurry mid-animation', async () => {
    const { setOpen, query } = renderHarness(fixture.animated);

    setOpen(false);
    setOpen(true);
    // Reopening mid-exit keeps (or restores) the mount.
    expect(query()).not.toBeNull();

    // And it doesn't fall over afterwards: a later close still exits.
    setOpen(false);
    await waitFor(() => expect(query()).toBeNull());
  });
});
