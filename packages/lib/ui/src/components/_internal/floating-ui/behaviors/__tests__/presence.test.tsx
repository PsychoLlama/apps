/**
 * Immediate-path tests for presence. jsdom has no Web Animations API
 * (`getAnimations` is missing), which is exactly the no-motion case;
 * the exit-motion hold is asserted in the browser suite.
 */

import { createRoot, createSignal } from 'solid-js';
import { createPresence } from '../presence';

const mountPresence = (initiallyOpen: boolean) => {
  const [open, setOpen] = createSignal(initiallyOpen);
  const element = document.createElement('div');
  document.body.replaceChildren(element);

  const presence = createRoot((dispose) => {
    const { mounted, props } = createPresence({
      open,
      element: () => element,
    });
    return { mounted, props, dispose };
  });

  return { setOpen, ...presence };
};

describe('createPresence', () => {
  it('mounts while open', () => {
    const presence = mountPresence(true);
    expect(presence.mounted()).toBe(true);
    presence.dispose();
  });

  it('starts unmounted while closed', () => {
    const presence = mountPresence(false);
    expect(presence.mounted()).toBe(false);
    presence.dispose();
  });

  it('unmounts immediately without exit motion', () => {
    const presence = mountPresence(true);

    presence.setOpen(false);
    expect(presence.mounted()).toBe(false);

    presence.dispose();
  });

  it('remounts on reopen', () => {
    const presence = mountPresence(true);

    presence.setOpen(false);
    presence.setOpen(true);
    expect(presence.mounted()).toBe(true);

    presence.dispose();
  });

  it('unmounts immediately when the element is already gone', () => {
    const [open, setOpen] = createSignal(true);
    const presence = createRoot((dispose) => {
      const { mounted } = createPresence({ open, element: () => null });
      return { mounted, dispose };
    });

    setOpen(false);
    expect(presence.mounted()).toBe(false);

    presence.dispose();
  });

  it('reflects the open state into the returned props', () => {
    const presence = mountPresence(true);
    expect(presence.props['data-state']).toBe('open');

    presence.setOpen(false);
    expect(presence.props['data-state']).toBe('closed');

    presence.dispose();
  });
});
