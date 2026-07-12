import { createRoot, createSignal } from 'solid-js';
import { createDismiss, type DismissConfig } from '../dismiss';

/** Mount a dismiss layer inside a disposable root. */
const mountLayer = (config: () => DismissConfig | null) =>
  createRoot((dispose) => {
    createDismiss(config);
    return dispose;
  });

const pressEscape = () =>
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );

/** jsdom has no PointerEvent constructor; the handler only reads
 * `target`, so a plain bubbling event exercises it faithfully. */
const pointerDownOn = (element: Element | Document) =>
  element.dispatchEvent(new Event('pointerdown', { bubbles: true }));

const focusInto = (element: Element) =>
  element.dispatchEvent(new Event('focusin', { bubbles: true }));

describe('createDismiss', () => {
  let inside: HTMLElement;
  let outside: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    inside = document.createElement('div');
    outside = document.createElement('div');
    document.body.append(inside, outside);
  });

  it('dismisses on Escape', () => {
    const onDismiss = vi.fn();
    const dispose = mountLayer(() => ({ inside: [inside], onDismiss }));

    pressEscape();
    expect(onDismiss).toHaveBeenCalledWith('escape');

    dispose();
  });

  it('only the topmost layer handles Escape', () => {
    const bottom = vi.fn();
    const top = vi.fn();
    const disposeBottom = mountLayer(() => ({
      inside: [inside],
      onDismiss: bottom,
    }));
    const disposeTop = mountLayer(() => ({
      inside: [outside],
      onDismiss: top,
    }));

    pressEscape();
    expect(top).toHaveBeenCalledWith('escape');
    expect(bottom).not.toHaveBeenCalled();

    // Unwinding the stack hands Escape to the next layer down.
    disposeTop();
    pressEscape();
    expect(bottom).toHaveBeenCalledWith('escape');

    disposeBottom();
  });

  it('dismisses on pointer-down outside, but never inside', () => {
    const onDismiss = vi.fn();
    const child = document.createElement('button');
    inside.append(child);
    const dispose = mountLayer(() => ({ inside: [inside], onDismiss }));

    // Nested content counts as inside — no portals, so containment
    // answers it.
    pointerDownOn(child);
    expect(onDismiss).not.toHaveBeenCalled();

    pointerDownOn(outside);
    expect(onDismiss).toHaveBeenCalledWith('pointer-outside');

    dispose();
  });

  it('treats every listed element as inside', () => {
    const onDismiss = vi.fn();
    const trigger = document.createElement('button');
    document.body.append(trigger);
    const dispose = mountLayer(() => ({
      inside: [inside, trigger],
      onDismiss,
    }));

    pointerDownOn(trigger);
    expect(onDismiss).not.toHaveBeenCalled();

    dispose();
  });

  it('ignores focus by default and dismisses when opted in', () => {
    const onDismiss = vi.fn();
    const dispose = mountLayer(() => ({ inside: [inside], onDismiss }));
    focusInto(outside);
    expect(onDismiss).not.toHaveBeenCalled();
    dispose();

    const disposeOptedIn = mountLayer(() => ({
      inside: [inside],
      onDismiss,
      focusOutside: true,
    }));
    focusInto(outside);
    expect(onDismiss).toHaveBeenCalledWith('focus-outside');
    disposeOptedIn();
  });

  it('supports disabling individual triggers', () => {
    const onDismiss = vi.fn();
    const dispose = mountLayer(() => ({
      inside: [inside],
      onDismiss,
      escape: false,
      pointerDownOutside: false,
    }));

    pressEscape();
    pointerDownOn(outside);
    expect(onDismiss).not.toHaveBeenCalled();

    dispose();
  });

  it('deactivates entirely while the config is null', () => {
    const onDismiss = vi.fn();
    const [config, setConfig] = createSignal<DismissConfig | null>(null);
    // eslint-disable-next-line solid/reactivity -- createDismiss tracks the accessor in its own effect
    const dispose = mountLayer(config);

    pressEscape();
    expect(onDismiss).not.toHaveBeenCalled();

    setConfig({ inside: [], onDismiss });
    pressEscape();
    expect(onDismiss).toHaveBeenCalledTimes(1);

    setConfig(null);
    pressEscape();
    expect(onDismiss).toHaveBeenCalledTimes(1);

    dispose();
  });

  it('stops listening after disposal', () => {
    const onDismiss = vi.fn();
    const dispose = mountLayer(() => ({ inside: [inside], onDismiss }));
    dispose();

    pressEscape();
    pointerDownOn(outside);
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
