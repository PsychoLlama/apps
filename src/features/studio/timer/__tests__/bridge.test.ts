import { GLOBAL_EVENT_BUS, publish, ref } from '#state';
import { GLOBAL_REGISTRY, createStore, destroyStore } from '#state/next';
import {
  pauseRecordingWorkflow,
  resumeRecordingWorkflow,
  startRecordingWorkflow,
  stopRecordingWorkflow,
} from '../../session/workflows';
import '../bridge';
import { timerStore, type TimerState } from '../store';

const startedPayload = () => ({
  tracks: [],
  streams: {},
  recorder: ref({} as MediaRecorder),
  chunks: ref([] as Blob[]),
  startedAt: 1000,
});

/**
 * The bridge subscribes against GLOBAL_EVENT_BUS at module load. These
 * tests use the global registry's live `timerStore` instance, resetting
 * between cases so assertions start from a clean baseline.
 */
describe('timer bridge (session → timer)', () => {
  let timer: ReturnType<typeof createStore<TimerState>>;

  beforeEach(() => {
    destroyStore(GLOBAL_REGISTRY, timerStore);
    timer = createStore(GLOBAL_REGISTRY, timerStore);
  });

  it('starts the timer on startRecordingWorkflow.resolved', () => {
    publish(
      GLOBAL_EVENT_BUS,
      startRecordingWorkflow.resolved,
      startedPayload(),
    );

    expect(timer.running).toBe(true);
    expect(timer.elapsed).toBe(0);
  });

  it('pauses the timer on pauseRecordingWorkflow.started', () => {
    publish(
      GLOBAL_EVENT_BUS,
      startRecordingWorkflow.resolved,
      startedPayload(),
    );

    publish(GLOBAL_EVENT_BUS, pauseRecordingWorkflow.started, undefined);

    expect(timer.running).toBe(false);
  });

  it('resumes the timer on resumeRecordingWorkflow.started', () => {
    publish(
      GLOBAL_EVENT_BUS,
      startRecordingWorkflow.resolved,
      startedPayload(),
    );
    publish(GLOBAL_EVENT_BUS, pauseRecordingWorkflow.started, undefined);

    publish(GLOBAL_EVENT_BUS, resumeRecordingWorkflow.started, undefined);

    expect(timer.running).toBe(true);
  });

  it('stops the timer on stopRecordingWorkflow.started', () => {
    publish(
      GLOBAL_EVENT_BUS,
      startRecordingWorkflow.resolved,
      startedPayload(),
    );

    publish(GLOBAL_EVENT_BUS, stopRecordingWorkflow.started, 60);

    expect(timer.running).toBe(false);
  });
});
