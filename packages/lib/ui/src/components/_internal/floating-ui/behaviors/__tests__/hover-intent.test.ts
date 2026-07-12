import { createRoot } from 'solid-js';
import { createHoverIntent, type HoverIntent } from '../hover-intent';

describe('createHoverIntent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mount = (onOpenChange: (open: boolean) => void) =>
    createRoot((dispose) => {
      const intent = createHoverIntent(() => ({
        openDelay: 700,
        closeDelay: 300,
        onOpenChange,
      }));
      return { intent, dispose };
    });

  const openViaHover = (intent: HoverIntent) => {
    intent.enter();
    vi.advanceTimersByTime(700);
  };

  it('opens only after the dwell delay', () => {
    const onOpenChange = vi.fn();
    const { intent, dispose } = mount(onOpenChange);

    intent.enter();
    vi.advanceTimersByTime(699);
    expect(onOpenChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);

    dispose();
  });

  it('cancels a pending open when the pointer leaves early', () => {
    const onOpenChange = vi.fn();
    const { intent, dispose } = mount(onOpenChange);

    intent.enter();
    vi.advanceTimersByTime(300);
    intent.leave();
    vi.runAllTimers();

    expect(onOpenChange).not.toHaveBeenCalled();

    dispose();
  });

  it('lingers before closing, and re-entry cancels the close', () => {
    const onOpenChange = vi.fn();
    const { intent, dispose } = mount(onOpenChange);
    openViaHover(intent);

    // Crossing a gap toward the surface: leave, then return.
    intent.leave();
    vi.advanceTimersByTime(299);
    intent.enter();
    vi.runAllTimers();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    intent.leave();
    vi.advanceTimersByTime(300);
    expect(onOpenChange).toHaveBeenCalledWith(false);

    dispose();
  });

  it('opens and closes immediately on demand', () => {
    const onOpenChange = vi.fn();
    const { intent, dispose } = mount(onOpenChange);

    // Keyboard focus opens without a dwell.
    intent.open();
    expect(onOpenChange).toHaveBeenCalledWith(true);

    // Escape closes without a linger, canceling any pending timer.
    intent.leave();
    intent.close();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    vi.runAllTimers();
    expect(onOpenChange).toHaveBeenCalledTimes(2);

    dispose();
  });

  it('never fires redundant state changes', () => {
    const onOpenChange = vi.fn();
    const { intent, dispose } = mount(onOpenChange);

    // Entering while already open must not re-fire on the dwell timer.
    openViaHover(intent);
    intent.enter();
    vi.runAllTimers();

    expect(onOpenChange).toHaveBeenCalledTimes(1);

    dispose();
  });

  it('drops pending timers with the owning component', () => {
    const onOpenChange = vi.fn();
    const { intent, dispose } = mount(onOpenChange);

    intent.enter();
    dispose();
    vi.runAllTimers();

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
