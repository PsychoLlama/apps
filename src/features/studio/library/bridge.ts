/**
 * Temporary bridge from the old session workflow pub/sub to the new
 * library actions. Delete this file once the session feature migrates
 * to `#state/next` and drives library transitions directly from its
 * effect handlers.
 */
import { GLOBAL_EVENT_BUS, subscribe } from '#state';
import { GLOBAL_REGISTRY, invoke } from '#state/next';
import { stopRecordingWorkflow } from '../session/workflows';
import { addRecording, type AddRecordingInput } from './actions';

subscribe(
  GLOBAL_EVENT_BUS,
  [stopRecordingWorkflow.resolved],
  (_topic, payload) => {
    invoke(GLOBAL_REGISTRY, addRecording, payload as AddRecordingInput);
  },
);
