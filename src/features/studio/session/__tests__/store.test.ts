import { createEventBus, publish, useWorkflow } from '#state';
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

function setup() {
  const bus = createEventBus();
  const [state, dispose] = createSessionStore(bus);
  const start = useWorkflow(startRecordingWorkflow, bus);
  const stop = useWorkflow(stopRecordingWorkflow, bus);
  const pause = useWorkflow(pauseRecordingWorkflow, bus);
  const resume = useWorkflow(resumeRecordingWorkflow, bus);
  return { state, dispose, bus, start, stop, pause, resume };
}

describe('createSessionStore', () => {
  it('initializes as idle with no tracks', () => {
    const { state } = setup();

    expect(state.status).toBe('idle');
    expect(state.tracks).toEqual([]);
    expect(state.error).toBeNull();
  });

  describe('startRecordingWorkflow', () => {
    it('transitions to recording', () => {
      const { state, start } = setup();

      start();

      expect(state.status).toBe('recording');
    });

    it('clears any previous error', () => {
      const { state, bus, start } = setup();
      publish(
        bus,
        startRecordingWorkflow.rejected,
        new Error('earlier failure'),
      );

      start();

      expect(state.error).toBeNull();
    });

    it('sets tracks from the capture activity', () => {
      const { state, start } = setup();

      start();

      expect(state.tracks.length).toBeGreaterThan(0);
      expect(state.tracks[0]).toEqual(
        expect.objectContaining({ type: 'screen' }),
      );
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
      const { state, start, stop } = setup();
      start();

      stop(60);

      expect(state.status).toBe('idle');
      expect(state.tracks).toEqual([]);
    });

    it('clears error state', () => {
      const { state, bus, stop } = setup();
      publish(bus, startRecordingWorkflow.rejected, new Error('oops'));

      stop(0);

      expect(state.error).toBeNull();
    });
  });

  describe('pauseRecordingWorkflow', () => {
    it('transitions to paused', () => {
      const { state, start, pause } = setup();
      start();

      pause();

      expect(state.status).toBe('paused');
    });
  });

  describe('resumeRecordingWorkflow', () => {
    it('transitions back to recording', () => {
      const { state, start, pause, resume } = setup();
      start();
      pause();

      resume();

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

      publish(bus, addTrackWorkflow.resolved, track);

      expect(state.tracks).toEqual([track]);
    });
  });

  describe('removeTrackWorkflow', () => {
    it('removes a track by ID', () => {
      const { state, bus } = setup();
      publish(bus, startRecordingWorkflow.resolved, {
        tracks: [
          { id: '1', type: 'screen', label: 'Screen', live: true },
          { id: '2', type: 'microphone', label: 'Mic', live: true },
        ],
        startedAt: 1000,
      });

      publish(bus, removeTrackWorkflow.resolved, '1');

      expect(state.tracks).toEqual([
        { id: '2', type: 'microphone', label: 'Mic', live: true },
      ]);
    });

    it('does nothing for an unknown track ID', () => {
      const { state, bus } = setup();
      publish(bus, startRecordingWorkflow.resolved, {
        tracks: [{ id: '1', type: 'screen', label: 'Screen', live: true }],
        startedAt: 1000,
      });

      publish(bus, removeTrackWorkflow.resolved, 'unknown');

      expect(state.tracks).toHaveLength(1);
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
      const { state, start, stop, pause, resume } = setup();

      expect(state.status).toBe('idle');

      start();
      expect(state.status).toBe('recording');

      pause();
      expect(state.status).toBe('paused');

      resume();
      expect(state.status).toBe('recording');

      stop(120);
      expect(state.status).toBe('idle');
    });
  });
});
