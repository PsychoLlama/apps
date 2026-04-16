import {
  type EventBus,
  createEventBus,
  publish,
  ref,
  type Topic,
} from '#state';
import { createSessionStore } from '../store';
import {
  startRecordingWorkflow,
  stopRecordingWorkflow,
  pauseRecordingWorkflow,
  resumeRecordingWorkflow,
  addTrackWorkflow,
  removeTrackWorkflow,
  checkSupportWorkflow,
} from '../workflows';
import type { Track } from '../types';

/** Publish a void lifecycle topic from a workflow with no input. */
function fire(bus: EventBus, topic: Topic<unknown>) {
  publish(bus, topic as Topic<void>);
}

function setup() {
  const bus = createEventBus();
  const [state, dispose] = createSessionStore(bus);
  return { state, dispose, bus };
}

const fakeTracks: Track[] = [
  { id: '1', type: 'screen', label: 'Screen', live: true },
  { id: '2', type: 'system-audio', label: 'Audio', live: true },
];

function startedPayload(tracks: Track[]) {
  return {
    tracks,
    streams: Object.fromEntries(
      tracks.map((t) => [t.id, ref({} as MediaStream)]),
    ),
    recorder: ref({} as MediaRecorder),
    chunks: ref([] as Blob[]),
    startedAt: 1000,
  };
}

function addTrackPayload(track: Track) {
  return { track, streamRef: ref({} as MediaStream) };
}

describe('createSessionStore', () => {
  it('initializes as idle with no tracks', () => {
    const { state } = setup();

    expect(state.status).toBe('idle');
    expect(state.tracks).toEqual([]);
    expect(state.error).toBeNull();
  });

  describe('startRecordingWorkflow', () => {
    it('transitions to recording on started', () => {
      const { state, bus } = setup();

      publish(bus, startRecordingWorkflow.started, vi.fn());

      expect(state.status).toBe('recording');
    });

    it('clears any previous error on started', () => {
      const { state, bus } = setup();
      publish(bus, startRecordingWorkflow.rejected, new Error('earlier'));

      publish(bus, startRecordingWorkflow.started, vi.fn());

      expect(state.error).toBeNull();
    });

    it('sets tracks on resolved', () => {
      const { state, bus } = setup();

      publish(bus, startRecordingWorkflow.resolved, startedPayload(fakeTracks));

      expect(state.tracks).toEqual(fakeTracks);
    });

    it('transitions to error on rejection', () => {
      const { state, bus } = setup();

      publish(
        bus,
        startRecordingWorkflow.rejected,
        new Error('Permission denied'),
      );

      expect(state.status).toBe('error');
      expect(state.error).toBe('Permission denied');
    });
  });

  describe('stopRecordingWorkflow', () => {
    it('transitions to idle and clears tracks', () => {
      const { state, bus } = setup();
      publish(bus, startRecordingWorkflow.resolved, startedPayload(fakeTracks));

      publish(bus, stopRecordingWorkflow.started, 60);

      expect(state.status).toBe('idle');
      expect(state.tracks).toEqual([]);
    });

    it('clears refs on resolved', () => {
      const { state, bus } = setup();
      publish(bus, startRecordingWorkflow.resolved, startedPayload(fakeTracks));

      publish(bus, stopRecordingWorkflow.resolved, {
        id: 'r1',
        elapsed: 10,
        stoppedAt: 2000,
        url: 'blob:test',
      });

      expect(state.streams).toEqual({});
      expect(state.recorder).toBeNull();
      expect(state.chunks).toBeNull();
    });

    it('clears error state', () => {
      const { state, bus } = setup();
      publish(bus, startRecordingWorkflow.rejected, new Error('oops'));

      publish(bus, stopRecordingWorkflow.started, 0);

      expect(state.error).toBeNull();
    });
  });

  describe('pauseRecordingWorkflow', () => {
    it('transitions to paused', () => {
      const { state, bus } = setup();
      publish(bus, startRecordingWorkflow.started, vi.fn());

      fire(bus, pauseRecordingWorkflow.started);

      expect(state.status).toBe('paused');
    });
  });

  describe('resumeRecordingWorkflow', () => {
    it('transitions back to recording', () => {
      const { state, bus } = setup();
      publish(bus, startRecordingWorkflow.started, vi.fn());
      fire(bus, pauseRecordingWorkflow.started);

      fire(bus, resumeRecordingWorkflow.started);

      expect(state.status).toBe('recording');
    });
  });

  describe('addTrackWorkflow', () => {
    it('appends a track on resolved', () => {
      const { state, bus } = setup();
      const track: Track = {
        id: '3',
        type: 'microphone',
        label: 'Microphone',
        live: true,
      };

      publish(bus, addTrackWorkflow.resolved, addTrackPayload(track));

      expect(state.tracks).toEqual([track]);
    });

    it('stores the stream ref alongside the track', () => {
      const { state, bus } = setup();
      const track: Track = {
        id: '3',
        type: 'microphone',
        label: 'Microphone',
        live: true,
      };
      const payload = addTrackPayload(track);

      publish(bus, addTrackWorkflow.resolved, payload);

      expect(state.streams['3']).toBe(payload.streamRef);
    });
  });

  describe('removeTrackWorkflow', () => {
    it('removes a track by ID', () => {
      const { state, bus } = setup();
      publish(
        bus,
        startRecordingWorkflow.resolved,
        startedPayload([
          { id: '1', type: 'screen', label: 'Screen', live: true },
          { id: '2', type: 'microphone', label: 'Mic', live: true },
        ]),
      );

      publish(bus, removeTrackWorkflow.resolved, '1');

      expect(state.tracks).toEqual([
        { id: '2', type: 'microphone', label: 'Mic', live: true },
      ]);
    });

    it('does nothing for an unknown track ID', () => {
      const { state, bus } = setup();
      publish(
        bus,
        startRecordingWorkflow.resolved,
        startedPayload([
          { id: '1', type: 'screen', label: 'Screen', live: true },
        ]),
      );

      publish(bus, removeTrackWorkflow.resolved, 'unknown');

      expect(state.tracks).toHaveLength(1);
    });

    it('drops the stream ref', () => {
      const { state, bus } = setup();
      publish(
        bus,
        startRecordingWorkflow.resolved,
        startedPayload([
          { id: '1', type: 'screen', label: 'Screen', live: true },
        ]),
      );

      publish(bus, removeTrackWorkflow.resolved, '1');

      expect(state.streams['1']).toBeUndefined();
    });
  });

  describe('checkSupportWorkflow', () => {
    it('transitions to unsupported when not supported', () => {
      const { state, bus } = setup();

      publish(bus, checkSupportWorkflow.resolved, false);

      expect(state.status).toBe('unsupported');
    });

    it('stays idle when supported', () => {
      const { state, bus } = setup();

      publish(bus, checkSupportWorkflow.resolved, true);

      expect(state.status).toBe('idle');
    });
  });

  describe('full lifecycle', () => {
    it('idle → recording → paused → recording → idle', () => {
      const { state, bus } = setup();

      expect(state.status).toBe('idle');

      publish(bus, startRecordingWorkflow.started, vi.fn());
      expect(state.status).toBe('recording');

      fire(bus, pauseRecordingWorkflow.started);
      expect(state.status).toBe('paused');

      fire(bus, resumeRecordingWorkflow.started);
      expect(state.status).toBe('recording');

      publish(bus, stopRecordingWorkflow.started, 120);
      expect(state.status).toBe('idle');
    });
  });
});
