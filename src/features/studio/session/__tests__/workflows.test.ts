import { createEventBus, publish, ref, subscribe } from '#state';
import {
  startRecordingWorkflow,
  stopRecordingWorkflow,
  removeTrackWorkflow,
} from '../workflows';
import { createSessionStore } from '../store';

describe('workflow lifecycle topics', () => {
  it('startRecordingWorkflow exposes started, resolved, and rejected', () => {
    expect(typeof startRecordingWorkflow.started).toBe('symbol');
    expect(typeof startRecordingWorkflow.resolved).toBe('symbol');
    expect(typeof startRecordingWorkflow.rejected).toBe('symbol');
  });

  it('stopRecordingWorkflow exposes started, resolved, and rejected', () => {
    expect(typeof stopRecordingWorkflow.started).toBe('symbol');
    expect(typeof stopRecordingWorkflow.resolved).toBe('symbol');
    expect(typeof stopRecordingWorkflow.rejected).toBe('symbol');
  });
});

describe('session store through workflow lifecycle', () => {
  it('transitions session state across the recording lifecycle', () => {
    const bus = createEventBus();
    const [session] = createSessionStore(bus);

    publish(bus, startRecordingWorkflow.started, vi.fn());
    expect(session.status).toBe('recording');

    publish(bus, startRecordingWorkflow.resolved, {
      tracks: [{ id: '1', type: 'screen', label: 'Screen', live: true }],
      streams: { '1': ref({} as MediaStream) },
      recorder: ref({} as MediaRecorder),
      chunks: ref([] as Blob[]),
      startedAt: 1000,
    });
    expect(session.tracks).toHaveLength(1);

    publish(bus, stopRecordingWorkflow.started, 45);
    expect(session.status).toBe('idle');
    expect(session.tracks).toEqual([]);
  });
});

describe('removeTrackWorkflow', () => {
  it('resolved payload is the track ID string', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    subscribe(bus, [removeTrackWorkflow.resolved], handler);
    publish(bus, removeTrackWorkflow.resolved, 'track-42');

    expect(handler).toHaveBeenCalledWith(
      removeTrackWorkflow.resolved,
      'track-42',
    );
  });
});
