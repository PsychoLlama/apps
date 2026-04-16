import {
  type EventBus,
  createEventBus,
  publish,
  useTopic,
  type Topic,
} from '#state';
import { createTimerStore } from '../store';
import { tick } from '../topics';
import {
  startRecordingWorkflow,
  stopRecordingWorkflow,
  pauseRecordingWorkflow,
  resumeRecordingWorkflow,
} from '../../session/workflows';

/** Publish a void lifecycle topic from a workflow with no input. */
function fire(bus: EventBus, topic: Topic<unknown>) {
  publish(bus, topic as Topic<void>);
}

function setup() {
  const bus = createEventBus();
  const [state, dispose] = createTimerStore(bus);
  const publishTick = useTopic(tick, bus);
  return { state, dispose, bus, publishTick };
}

function publishStarted(bus: ReturnType<typeof createEventBus>) {
  publish(bus, startRecordingWorkflow.resolved, {
    tracks: [],
    startedAt: 1000,
  });
}

describe('createTimerStore', () => {
  it('initializes as stopped with zero elapsed', () => {
    const { state } = setup();

    expect(state.running).toBe(false);
    expect(state.elapsed).toBe(0);
  });

  describe('tick', () => {
    it('increments elapsed when running', () => {
      const { state, bus, publishTick } = setup();
      publishStarted(bus);

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
      const { state, bus, publishTick } = setup();
      publishStarted(bus);
      publishTick();
      fire(bus, pauseRecordingWorkflow.started);

      publishTick();
      publishTick();

      expect(state.elapsed).toBe(1);
    });
  });

  describe('session lifecycle', () => {
    it('starts running and resets on startRecordingWorkflow.resolved', () => {
      const { state, bus } = setup();

      publishStarted(bus);

      expect(state.running).toBe(true);
      expect(state.elapsed).toBe(0);
    });

    it('resets elapsed when a new recording starts', () => {
      const { state, bus, publishTick } = setup();
      publishStarted(bus);
      publishTick();
      publishTick();

      publishStarted(bus);

      expect(state.elapsed).toBe(0);
    });

    it('stops on pauseRecordingWorkflow', () => {
      const { state, bus } = setup();
      publishStarted(bus);

      fire(bus, pauseRecordingWorkflow.started);

      expect(state.running).toBe(false);
    });

    it('resumes on resumeRecordingWorkflow', () => {
      const { state, bus } = setup();
      publishStarted(bus);
      fire(bus, pauseRecordingWorkflow.started);

      fire(bus, resumeRecordingWorkflow.started);

      expect(state.running).toBe(true);
    });

    it('stops on stopRecordingWorkflow', () => {
      const { state, bus } = setup();
      publishStarted(bus);

      publish(bus, stopRecordingWorkflow.started, 60);

      expect(state.running).toBe(false);
    });
  });

  describe('full cycle', () => {
    it('accumulates time across pause/resume', () => {
      const { state, bus, publishTick } = setup();

      publishStarted(bus);

      publishTick();
      publishTick();
      expect(state.elapsed).toBe(2);

      fire(bus, pauseRecordingWorkflow.started);
      publishTick();
      expect(state.elapsed).toBe(2);

      fire(bus, resumeRecordingWorkflow.started);
      publishTick();
      publishTick();
      publishTick();
      expect(state.elapsed).toBe(5);

      publish(bus, stopRecordingWorkflow.started, 5);
      expect(state.running).toBe(false);
    });
  });
});
