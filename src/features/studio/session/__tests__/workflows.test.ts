import { createEventBus, publish, subscribe } from '#state';
import {
  startRecordingWorkflow,
  stopRecordingWorkflow,
  removeTrackWorkflow,
} from '../workflows';
import { createSessionStore } from '../store';
import { createLibraryStore } from '../../library/store';

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

describe('integration: session + library stores via topics', () => {
  it('records a session and adds it to the library on stop', () => {
    const bus = createEventBus();
    const [session] = createSessionStore(bus);
    const [library] = createLibraryStore(bus);

    publish(bus, startRecordingWorkflow.started, vi.fn());
    expect(session.status).toBe('recording');

    publish(bus, startRecordingWorkflow.resolved, {
      tracks: [{ id: '1', type: 'screen', label: 'Screen', live: true }],
      startedAt: 1000,
    });
    expect(session.tracks).toHaveLength(1);

    publish(bus, stopRecordingWorkflow.started, 45);
    expect(session.status).toBe('idle');
    expect(session.tracks).toEqual([]);

    publish(bus, stopRecordingWorkflow.resolved, {
      id: 'rec-1',
      elapsed: 45,
      stoppedAt: 2000,
      url: 'blob:test',
    });
    expect(library.recordings).toHaveLength(1);
    expect(library.recordings[0].name).toBe('Recording 1');
    expect(library.recordings[0].duration).toBe(45);
    expect(library.recordings[0].url).toBe('blob:test');
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
