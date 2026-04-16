import { createEventBus, useTopic, useWorkflow } from '#state';
import { createTimerStore } from '../store';
import { tick } from '../topics';
import {
  startRecordingWorkflow,
  stopRecordingWorkflow,
  pauseRecordingWorkflow,
  resumeRecordingWorkflow,
} from '../../session/workflows';

function setup() {
  const bus = createEventBus();
  const [state, dispose] = createTimerStore(bus);
  const start = useWorkflow(startRecordingWorkflow, bus);
  const stop = useWorkflow(stopRecordingWorkflow, bus);
  const pause = useWorkflow(pauseRecordingWorkflow, bus);
  const resume = useWorkflow(resumeRecordingWorkflow, bus);
  const publishTick = useTopic(tick, bus);
  return { state, dispose, bus, start, stop, pause, resume, publishTick };
}

describe('createTimerStore', () => {
  it('initializes as stopped with zero elapsed', () => {
    const { state } = setup();

    expect(state.running).toBe(false);
    expect(state.elapsed).toBe(0);
  });

  describe('tick', () => {
    it('increments elapsed when running', () => {
      const { state, start, publishTick } = setup();
      start();

      publishTick();
      publishTick();
      publishTick();

      expect(state.elapsed).toBe(3);
    });

    it('does not increment when stopped', () => {
      const { state, publishTick } = setup();

      publishTick();
      publishTick();

      expect(state.elapsed).toBe(0);
    });

    it('does not increment when paused', () => {
      const { state, start, pause, publishTick } = setup();
      start();
      publishTick();
      pause();

      publishTick();
      publishTick();

      expect(state.elapsed).toBe(1);
    });
  });

  describe('session lifecycle', () => {
    it('starts running and resets on startRecordingWorkflow.resolved', () => {
      const { state, start } = setup();

      start();

      expect(state.running).toBe(true);
      expect(state.elapsed).toBe(0);
    });

    it('resets elapsed when a new recording starts', () => {
      const { state, start, publishTick } = setup();
      start();
      publishTick();
      publishTick();

      start();

      expect(state.elapsed).toBe(0);
    });

    it('stops on pauseRecordingWorkflow', () => {
      const { state, start, pause } = setup();
      start();

      pause();

      expect(state.running).toBe(false);
    });

    it('resumes on resumeRecordingWorkflow', () => {
      const { state, start, pause, resume } = setup();
      start();
      pause();

      resume();

      expect(state.running).toBe(true);
    });

    it('stops on stopRecordingWorkflow', () => {
      const { state, start, stop } = setup();
      start();

      stop(60);

      expect(state.running).toBe(false);
    });
  });

  describe('full cycle', () => {
    it('accumulates time across pause/resume', () => {
      const { state, start, stop, pause, resume, publishTick } = setup();

      start();

      publishTick();
      publishTick();
      expect(state.elapsed).toBe(2);

      pause();
      publishTick();
      expect(state.elapsed).toBe(2);

      resume();
      publishTick();
      publishTick();
      publishTick();
      expect(state.elapsed).toBe(5);

      stop(5);
      expect(state.running).toBe(false);
    });
  });
});
