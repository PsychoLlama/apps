/**
 * Immediate-path tests for visibility. jsdom has no Web Animations API,
 * which is exactly the no-motion case; the exit hold is asserted in the
 * browser suite.
 */

import { createRoot, createSignal } from 'solid-js';
import { createVisibility } from '../visibility';

const mountVisibility = (initiallyOpen: boolean) => {
  const [open, setOpen] = createSignal(initiallyOpen);
  const element = document.createElement('div');
  document.body.replaceChildren(element);

  const visibility = createRoot((dispose) => {
    const { visible, props } = createVisibility({
      open,
      element: () => element,
    });
    return { visible, props, dispose };
  });

  return { setOpen, ...visibility };
};

describe('createVisibility', () => {
  it('is visible while open', () => {
    const visibility = mountVisibility(true);
    expect(visibility.visible()).toBe(true);
    expect(visibility.props['data-state']).toBe('open');
    visibility.dispose();
  });

  it('starts at rest while closed, with no state at all', () => {
    const visibility = mountVisibility(false);
    expect(visibility.visible()).toBe(false);
    expect(visibility.props['data-state']).toBeUndefined();
    visibility.dispose();
  });

  it('returns to rest immediately without exit motion', () => {
    const visibility = mountVisibility(true);

    visibility.setOpen(false);
    expect(visibility.visible()).toBe(false);
    expect(visibility.props['data-state']).toBeUndefined();

    visibility.dispose();
  });

  it('becomes visible again on reopen', () => {
    const visibility = mountVisibility(true);

    visibility.setOpen(false);
    visibility.setOpen(true);
    expect(visibility.visible()).toBe(true);
    expect(visibility.props['data-state']).toBe('open');

    visibility.dispose();
  });

  it('returns to rest immediately before the element renders', () => {
    const [open, setOpen] = createSignal(true);
    const visibility = createRoot((dispose) => {
      const { visible } = createVisibility({ open, element: () => null });
      return { visible, dispose };
    });

    setOpen(false);
    expect(visibility.visible()).toBe(false);

    visibility.dispose();
  });
});
