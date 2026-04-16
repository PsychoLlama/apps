import { defineStore } from '#state';
import {
  startRecordingWorkflow,
  stopRecordingWorkflow,
  pauseRecordingWorkflow,
  resumeRecordingWorkflow,
} from '../session/workflows';
import { tick } from './topics';

export interface TimerState {
  running: boolean;
  elapsed: number;
}

export const createTimerStore = defineStore<TimerState>(
  () => ({ running: false, elapsed: 0 }),
  (on) => {
    on(startRecordingWorkflow.resolved, (state) => {
      state.running = true;
      state.elapsed = 0;
    });

    on(pauseRecordingWorkflow.started, (state) => {
      state.running = false;
    });

    on(resumeRecordingWorkflow.started, (state) => {
      state.running = true;
    });

    on(stopRecordingWorkflow.started, (state) => {
      state.running = false;
    });

    on(tick, (state) => {
      if (state.running) {
        state.elapsed += 1;
      }
    });
  },
);

export const [timer] = createTimerStore();
