/**
 * Temporary bridge from the old session workflow pub/sub to the new timer
 * actions. Delete this file once the session feature migrates to
 * `#state/next` and drives timer transitions directly from its effect
 * handlers.
 */
import { GLOBAL_EVENT_BUS, subscribe } from '#state';
import { GLOBAL_REGISTRY, invoke } from '#state/next';
import {
  pauseRecordingWorkflow,
  resumeRecordingWorkflow,
  startRecordingWorkflow,
  stopRecordingWorkflow,
} from '../session/workflows';
import { pauseTimer, resumeTimer, startTimer, stopTimer } from './actions';

subscribe(GLOBAL_EVENT_BUS, [startRecordingWorkflow.resolved], () => {
  invoke(GLOBAL_REGISTRY, startTimer, undefined);
});

subscribe(GLOBAL_EVENT_BUS, [pauseRecordingWorkflow.started], () => {
  invoke(GLOBAL_REGISTRY, pauseTimer, undefined);
});

subscribe(GLOBAL_EVENT_BUS, [resumeRecordingWorkflow.started], () => {
  invoke(GLOBAL_REGISTRY, resumeTimer, undefined);
});

subscribe(GLOBAL_EVENT_BUS, [stopRecordingWorkflow.started], () => {
  invoke(GLOBAL_REGISTRY, stopTimer, undefined);
});
