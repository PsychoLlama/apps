import { createRoot, createSignal } from 'solid-js';
import { createFocusMemory, createFocusTrap } from '../focus';

const button = (label: string) => {
  const element = document.createElement('button');
  element.textContent = label;
  return element;
};

const pressTab = (target: Element, shiftKey = false) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true }),
  );

describe('createFocusMemory', () => {
  it('remembers focus at the rising edge and restores it', () => {
    const trigger = button('trigger');
    const other = button('other');
    document.body.replaceChildren(trigger, other);
    trigger.focus();

    const [active, setActive] = createSignal(false);
    const restore = createRoot((dispose) => {
      const restoreFocus = createFocusMemory(active);
      return { restoreFocus, dispose };
    });

    setActive(true);
    // Focus wanders while the surface is open — the memory holds.
    other.focus();
    expect(document.activeElement).toBe(other);

    restore.restoreFocus();
    expect(document.activeElement).toBe(trigger);

    restore.dispose();
  });

  it('re-captures on each opening', () => {
    const first = button('first');
    const second = button('second');
    document.body.replaceChildren(first, second);

    const [active, setActive] = createSignal(false);
    const memory = createRoot((dispose) => {
      const restoreFocus = createFocusMemory(active);
      return { restoreFocus, dispose };
    });

    first.focus();
    setActive(true);
    setActive(false);

    second.focus();
    setActive(true);

    memory.restoreFocus();
    expect(document.activeElement).toBe(second);

    memory.dispose();
  });

  it('declines to restore to a disconnected element', () => {
    const trigger = button('trigger');
    const other = button('other');
    document.body.replaceChildren(trigger, other);
    trigger.focus();

    const [active, setActive] = createSignal(false);
    const memory = createRoot((dispose) => {
      const restoreFocus = createFocusMemory(active);
      return { restoreFocus, dispose };
    });

    setActive(true);
    other.focus();
    trigger.remove();

    memory.restoreFocus();
    expect(document.activeElement).toBe(other);

    memory.dispose();
  });
});

describe('createFocusTrap', () => {
  const mountTrap = (container: () => HTMLElement | null) =>
    createRoot((dispose) => {
      createFocusTrap(container);
      return dispose;
    });

  it('wraps Tab at the edges', () => {
    const container = document.createElement('div');
    const first = button('first');
    const last = button('last');
    container.append(first, last);
    document.body.replaceChildren(container);

    const dispose = mountTrap(() => container);

    last.focus();
    pressTab(last);
    expect(document.activeElement).toBe(first);

    pressTab(first, true);
    expect(document.activeElement).toBe(last);

    dispose();
  });

  it('pulls escaped focus back to the first tabbable', () => {
    const container = document.createElement('div');
    const inside = button('inside');
    container.append(inside);
    const outside = button('outside');
    document.body.replaceChildren(container, outside);

    const dispose = mountTrap(() => container);

    outside.focus();
    outside.dispatchEvent(new Event('focusin', { bubbles: true }));
    expect(document.activeElement).toBe(inside);

    dispose();
  });

  it('skips inert and disabled content when wrapping', () => {
    const container = document.createElement('div');
    const first = button('first');
    const dead = button('dead');
    dead.setAttribute('inert', '');
    const disabled = button('disabled');
    disabled.disabled = true;
    container.append(first, dead, disabled);
    document.body.replaceChildren(container);

    const dispose = mountTrap(() => container);

    first.focus();
    // `first` is also the last tabbable — Tab wraps onto itself.
    pressTab(first);
    expect(document.activeElement).toBe(first);

    dispose();
  });

  it('releases the trap on disposal', () => {
    const container = document.createElement('div');
    const inside = button('inside');
    container.append(inside);
    const outside = button('outside');
    document.body.replaceChildren(container, outside);

    const dispose = mountTrap(() => container);
    dispose();

    outside.focus();
    outside.dispatchEvent(new Event('focusin', { bubbles: true }));
    expect(document.activeElement).toBe(outside);
  });
});
