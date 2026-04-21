import { bindRegistry, createRegistry } from '#state';
import {
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
  tick,
} from '../bindings';
import { timerStore } from '../store';

function setup() {
  const bound = bindRegistry(createRegistry());
  return { ...bound, state: bound.createStore(timerStore) };
}

describe('timerStore', () => {
  it('initializes as stopped with zero elapsed', () => {
    const { state } = setup();

    expect(state.running).toBe(false);
    expect(state.elapsed).toBe(0);
  });

  describe('tick', () => {
    it('increments elapsed when running', () => {
      const { state, useAction } = setup();
      useAction(startTimer)(undefined);

      useAction(tick)(undefined);
      useAction(tick)(undefined);
      useAction(tick)(undefined);

      expect(state.elapsed).toBe(3);
    });

    it('does not increment when stopped', () => {
      const { state, useAction } = setup();

      useAction(tick)(undefined);
      useAction(tick)(undefined);

      expect(state.elapsed).toBe(0);
    });

    it('does not increment when paused', () => {
      const { state, useAction } = setup();
      useAction(startTimer)(undefined);
      useAction(tick)(undefined);
      useAction(pauseTimer)(undefined);

      useAction(tick)(undefined);
      useAction(tick)(undefined);

      expect(state.elapsed).toBe(1);
    });
  });

  describe('lifecycle actions', () => {
    it('startTimer starts running and resets elapsed', () => {
      const { state, useAction } = setup();

      useAction(startTimer)(undefined);

      expect(state.running).toBe(true);
      expect(state.elapsed).toBe(0);
    });

    it('startTimer resets elapsed on a fresh run', () => {
      const { state, useAction } = setup();
      useAction(startTimer)(undefined);
      useAction(tick)(undefined);
      useAction(tick)(undefined);

      useAction(startTimer)(undefined);

      expect(state.elapsed).toBe(0);
    });

    it('pauseTimer stops the timer', () => {
      const { state, useAction } = setup();
      useAction(startTimer)(undefined);

      useAction(pauseTimer)(undefined);

      expect(state.running).toBe(false);
    });

    it('resumeTimer resumes a paused timer', () => {
      const { state, useAction } = setup();
      useAction(startTimer)(undefined);
      useAction(pauseTimer)(undefined);

      useAction(resumeTimer)(undefined);

      expect(state.running).toBe(true);
    });

    it('stopTimer stops the timer', () => {
      const { state, useAction } = setup();
      useAction(startTimer)(undefined);

      useAction(stopTimer)(undefined);

      expect(state.running).toBe(false);
    });
  });

  describe('full cycle', () => {
    it('accumulates time across pause/resume', () => {
      const { state, useAction } = setup();

      useAction(startTimer)(undefined);
      useAction(tick)(undefined);
      useAction(tick)(undefined);
      expect(state.elapsed).toBe(2);

      useAction(pauseTimer)(undefined);
      useAction(tick)(undefined);
      expect(state.elapsed).toBe(2);

      useAction(resumeTimer)(undefined);
      useAction(tick)(undefined);
      useAction(tick)(undefined);
      useAction(tick)(undefined);
      expect(state.elapsed).toBe(5);

      useAction(stopTimer)(undefined);
      expect(state.running).toBe(false);
    });
  });
});
