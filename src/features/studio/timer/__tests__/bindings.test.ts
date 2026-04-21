import { createTestBindings } from '#state';
import {
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
  tick,
} from '../bindings';
import { timerStore } from '../store';

function setup() {
  const bindings = createTestBindings();
  return { ...bindings, state: bindings.createStore(timerStore) };
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
      useAction(startTimer)();

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
      useAction(startTimer)();
      useAction(tick)();
      useAction(pauseTimer)();

      useAction(tick)();
      useAction(tick)();

      expect(state.elapsed).toBe(1);
    });
  });

  describe('lifecycle actions', () => {
    it('startTimer starts running and resets elapsed', () => {
      const { state, useAction } = setup();

      useAction(startTimer)();

      expect(state.running).toBe(true);
      expect(state.elapsed).toBe(0);
    });

    it('startTimer resets elapsed on a fresh run', () => {
      const { state, useAction } = setup();
      useAction(startTimer)();
      useAction(tick)();
      useAction(tick)();

      useAction(startTimer)();

      expect(state.elapsed).toBe(0);
    });

    it('pauseTimer stops the timer', () => {
      const { state, useAction } = setup();
      useAction(startTimer)();

      useAction(pauseTimer)();

      expect(state.running).toBe(false);
    });

    it('resumeTimer resumes a paused timer', () => {
      const { state, useAction } = setup();
      useAction(startTimer)();
      useAction(pauseTimer)();

      useAction(resumeTimer)();

      expect(state.running).toBe(true);
    });

    it('stopTimer stops the timer', () => {
      const { state, useAction } = setup();
      useAction(startTimer)();

      useAction(stopTimer)();

      expect(state.running).toBe(false);
    });
  });

  describe('full cycle', () => {
    it('accumulates time across pause/resume', () => {
      const { state, useAction } = setup();

      useAction(startTimer)();
      useAction(tick)();
      useAction(tick)();
      expect(state.elapsed).toBe(2);

      useAction(pauseTimer)();
      useAction(tick)();
      expect(state.elapsed).toBe(2);

      useAction(resumeTimer)();
      useAction(tick)();
      useAction(tick)();
      useAction(tick)();
      expect(state.elapsed).toBe(5);

      useAction(stopTimer)();
      expect(state.running).toBe(false);
    });
  });
});
