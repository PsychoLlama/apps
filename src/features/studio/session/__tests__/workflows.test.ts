import { createEventBus, subscribe, useWorkflow } from '#state';
import {
  startRecordingWorkflow,
  stopRecordingWorkflow,
  pauseRecordingWorkflow,
  resumeRecordingWorkflow,
  addTrackWorkflow,
  removeTrackWorkflow,
} from '../workflows';
import { createSessionStore } from '../store';
import { createLibraryStore } from '../../library/store';

describe('startRecordingWorkflow', () => {
  it('resolves with tracks and a start timestamp', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    subscribe(bus, [startRecordingWorkflow.resolved], handler);
    const run = useWorkflow(startRecordingWorkflow, bus);
    run();

    const [, payload] = handler.mock.calls[0] as [
      unknown,
      { tracks: { type: string }[]; startedAt: number },
    ];
    expect(payload.tracks[0].type).toBe('screen');
    expect(payload.startedAt).toBeTypeOf('number');
  });
});

describe('stopRecordingWorkflow', () => {
  it('resolves with an ID, elapsed time, and stop timestamp', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    subscribe(bus, [stopRecordingWorkflow.resolved], handler);
    const run = useWorkflow(stopRecordingWorkflow, bus);
    run(90);

    const [, payload] = handler.mock.calls[0] as [
      unknown,
      { id: string; elapsed: number; stoppedAt: number },
    ];
    expect(payload.id).toBeTypeOf('string');
    expect(payload.elapsed).toBe(90);
    expect(payload.stoppedAt).toBeTypeOf('number');
  });
});

describe('pauseRecordingWorkflow', () => {
  it('publishes started and resolved', () => {
    const bus = createEventBus();
    const started = vi.fn();
    const resolved = vi.fn();

    subscribe(bus, [pauseRecordingWorkflow.started], started);
    subscribe(bus, [pauseRecordingWorkflow.resolved], resolved);
    const run = useWorkflow(pauseRecordingWorkflow, bus);
    run();

    expect(started).toHaveBeenCalled();
    expect(resolved).toHaveBeenCalled();
  });
});

describe('resumeRecordingWorkflow', () => {
  it('publishes started and resolved', () => {
    const bus = createEventBus();
    const started = vi.fn();
    const resolved = vi.fn();

    subscribe(bus, [resumeRecordingWorkflow.started], started);
    subscribe(bus, [resumeRecordingWorkflow.resolved], resolved);
    const run = useWorkflow(resumeRecordingWorkflow, bus);
    run();

    expect(started).toHaveBeenCalled();
    expect(resolved).toHaveBeenCalled();
  });
});

describe('addTrackWorkflow', () => {
  it('resolves with a new track matching the requested type', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    subscribe(bus, [addTrackWorkflow.resolved], handler);
    const run = useWorkflow(addTrackWorkflow, bus);
    run('microphone');

    const [, track] = handler.mock.calls[0] as [
      unknown,
      { type: string; label: string; live: boolean },
    ];
    expect(track.type).toBe('microphone');
    expect(track.label).toBe('Microphone');
    expect(track.live).toBe(true);
  });
});

describe('removeTrackWorkflow', () => {
  it('resolves with the removed track ID', () => {
    const bus = createEventBus();
    const handler = vi.fn();

    subscribe(bus, [removeTrackWorkflow.resolved], handler);
    const run = useWorkflow(removeTrackWorkflow, bus);
    run('track-42');

    expect(handler).toHaveBeenCalledWith(
      removeTrackWorkflow.resolved,
      'track-42',
    );
  });
});

describe('integration: session + library stores', () => {
  it('records a session and adds it to the library on stop', () => {
    const bus = createEventBus();
    const [session] = createSessionStore(bus);
    const [library] = createLibraryStore(bus);

    const start = useWorkflow(startRecordingWorkflow, bus);
    const stop = useWorkflow(stopRecordingWorkflow, bus);

    start();
    expect(session.status).toBe('recording');
    expect(session.tracks.length).toBeGreaterThan(0);

    stop(45);
    expect(session.status).toBe('idle');
    expect(session.tracks).toEqual([]);
    expect(library.recordings).toHaveLength(1);
    expect(library.recordings[0].name).toBe('Recording 1');
    expect(library.recordings[0].duration).toBe(45);
  });
});
