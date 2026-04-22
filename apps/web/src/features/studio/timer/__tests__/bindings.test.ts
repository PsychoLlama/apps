import { createTestBindings, defineAction } from '@psychollama/state';
import { tick } from '../bindings';
import { timerStore } from '../store';

// Session bindings own the start/pause/resume/stop mutations; the timer
// module just exposes `tick`. Tests fabricate a local anchor setter to
// drive the store into the configurations `tick` cares about.
const setStartedAt = defineAction(
  [timerStore],
  (timer, startedAt: number | null) => {
    timer.startedAt = startedAt;
  },
);

const setup = () => {
  const bindings = createTestBindings();
  return { ...bindings, state: bindings.createStore(timerStore) };
};

describe('timerStore', () => {
  it('initializes with no anchor and zero elapsed', () => {
    const { state } = setup();

    expect(state.startedAt).toBeNull();
    expect(state.elapsed).toBe(0);
  });

  describe('tick', () => {
    it('computes elapsed against the wall-clock anchor', () => {
      const { state, useAction } = setup();
      useAction(setStartedAt)(1000);

      useAction(tick)(4500);

      expect(state.elapsed).toBe(3);
    });

    it('floors fractional seconds', () => {
      const { state, useAction } = setup();
      useAction(setStartedAt)(0);

      useAction(tick)(2999);

      expect(state.elapsed).toBe(2);
    });

    it('does not touch elapsed when stopped', () => {
      const { state, useAction } = setup();

      useAction(tick)(123456);

      expect(state.elapsed).toBe(0);
    });
  });
});
