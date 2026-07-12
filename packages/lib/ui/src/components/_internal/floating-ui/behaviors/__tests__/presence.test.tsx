/**
 * Immediate-path tests for presence. jsdom computes no animations
 * (`animationName` is always empty), which is exactly the unanimated
 * case; the exit-animation hold is asserted in the browser suite.
 */

import { createRoot, createSignal } from 'solid-js';
import { createPresence } from '../presence';

const mountPresence = (initiallyOpen: boolean) => {
  const [open, setOpen] = createSignal(initiallyOpen);
  const element = document.createElement('div');
  document.body.replaceChildren(element);

  const mounted = createRoot((dispose) => {
    const isMounted = createPresence({
      open,
      element: () => element,
    });
    return { isMounted, dispose };
  });

  return { setOpen, ...mounted };
};

describe('createPresence', () => {
  it('mounts while open', () => {
    const presence = mountPresence(true);
    expect(presence.isMounted()).toBe(true);
    presence.dispose();
  });

  it('starts unmounted while closed', () => {
    const presence = mountPresence(false);
    expect(presence.isMounted()).toBe(false);
    presence.dispose();
  });

  it('unmounts immediately without an exit animation', () => {
    const presence = mountPresence(true);

    presence.setOpen(false);
    expect(presence.isMounted()).toBe(false);

    presence.dispose();
  });

  it('remounts on reopen', () => {
    const presence = mountPresence(true);

    presence.setOpen(false);
    presence.setOpen(true);
    expect(presence.isMounted()).toBe(true);

    presence.dispose();
  });

  it('unmounts immediately when the element is already gone', () => {
    const [open, setOpen] = createSignal(true);
    const mounted = createRoot((dispose) => {
      const isMounted = createPresence({ open, element: () => null });
      return { isMounted, dispose };
    });

    setOpen(false);
    expect(mounted.isMounted()).toBe(false);

    mounted.dispose();
  });
});
