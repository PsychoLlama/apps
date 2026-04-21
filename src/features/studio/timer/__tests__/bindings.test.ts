import { createTestBindings, defineAction } from '#state';
import { tick } from '../bindings';
import { timerStore } from '../store';

// Session bindings own the start/pause/resume mutations; the timer
// module just exposes `tick`. Tests fabricate a local setter to drive
// the store into the configurations `tick` cares about.
const setRunning = defineAction([timerStore], (timer, running: boolean) => {
  timer.running = running;
});

const setup = () => {
  const bindings = createTestBindings();
  return { ...bindings, state: bindings.createStore(timerStore) };
};

describe('timerStore', () => {
  it('initializes as stopped with zero elapsed', () => {
    const { state } = setup();

    expect(state.running).toBe(false);
    expect(state.elapsed).toBe(0);
  });

  describe('tick', () => {
    it('increments elapsed when running', () => {
      const { state, useAction } = setup();
      useAction(setRunning)(true);

      useAction(tick)();
      useAction(tick)();
      useAction(tick)();

      expect(state.elapsed).toBe(3);
    });

    it('does not increment when stopped', () => {
      const { state, useAction } = setup();

      useAction(tick)();
      useAction(tick)();

      expect(state.elapsed).toBe(0);
    });

    it('does not increment when paused', () => {
      const { state, useAction } = setup();
      useAction(setRunning)(true);
      useAction(tick)();
      useAction(setRunning)(false);

      useAction(tick)();
      useAction(tick)();

      expect(state.elapsed).toBe(1);
    });
  });
});
