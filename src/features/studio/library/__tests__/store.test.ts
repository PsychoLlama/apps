import { createEventBus, publish } from '#state';
import { createLibraryStore } from '../store';
import { deleteRecordingWorkflow, renameRecordingWorkflow } from '../workflows';
import { stopRecordingWorkflow } from '../../session/workflows';

function setup() {
  const bus = createEventBus();
  const [state, dispose] = createLibraryStore(bus);
  return { state, dispose, bus };
}

describe('createLibraryStore', () => {
  it('initializes with an empty recording list', () => {
    const { state } = setup();

    expect(state.recordings).toEqual([]);
  });

  it('appends a recording when stopRecordingWorkflow resolves', () => {
    const { state, bus } = setup();

    publish(bus, stopRecordingWorkflow.resolved, {
      id: 'rec-1',
      elapsed: 120,
      stoppedAt: 1000,
      url: 'blob:test',
    });

    expect(state.recordings).toHaveLength(1);
    expect(state.recordings[0]).toEqual({
      id: 'rec-1',
      name: 'Recording 1',
      duration: 120,
      createdAt: 1000,
      url: 'blob:test',
    });
  });

  it('names recordings sequentially', () => {
    const { state, bus } = setup();

    publish(bus, stopRecordingWorkflow.resolved, {
      id: 'a',
      elapsed: 60,
      stoppedAt: 1000,
      url: 'blob:a',
    });
    publish(bus, stopRecordingWorkflow.resolved, {
      id: 'b',
      elapsed: 90,
      stoppedAt: 2000,
      url: 'blob:b',
    });
    publish(bus, stopRecordingWorkflow.resolved, {
      id: 'c',
      elapsed: 30,
      stoppedAt: 3000,
      url: 'blob:c',
    });

    expect(state.recordings.map((r) => r.name)).toEqual([
      'Recording 1',
      'Recording 2',
      'Recording 3',
    ]);
  });

  it('preserves elapsed, timestamp, and url from the workflow', () => {
    const { state, bus } = setup();

    publish(bus, stopRecordingWorkflow.resolved, {
      id: 'rec-1',
      elapsed: 300,
      stoppedAt: 1713200000000,
      url: 'blob:download',
    });

    expect(state.recordings[0].duration).toBe(300);
    expect(state.recordings[0].createdAt).toBe(1713200000000);
    expect(state.recordings[0].url).toBe('blob:download');
  });

  describe('deleteRecordingWorkflow', () => {
    it('removes a recording by id when resolved', () => {
      const { state, bus } = setup();
      publish(bus, stopRecordingWorkflow.resolved, {
        id: 'a',
        elapsed: 1,
        stoppedAt: 1,
        url: 'blob:a',
      });
      publish(bus, stopRecordingWorkflow.resolved, {
        id: 'b',
        elapsed: 2,
        stoppedAt: 2,
        url: 'blob:b',
      });

      publish(bus, deleteRecordingWorkflow.resolved, 'a');

      expect(state.recordings.map((r) => r.id)).toEqual(['b']);
    });

    it('is a no-op when the id is unknown', () => {
      const { state, bus } = setup();
      publish(bus, stopRecordingWorkflow.resolved, {
        id: 'a',
        elapsed: 1,
        stoppedAt: 1,
        url: 'blob:a',
      });

      publish(bus, deleteRecordingWorkflow.resolved, 'nope');

      expect(state.recordings).toHaveLength(1);
    });
  });

  describe('renameRecordingWorkflow', () => {
    it('updates the recording name by id when resolved', () => {
      const { state, bus } = setup();
      publish(bus, stopRecordingWorkflow.resolved, {
        id: 'a',
        elapsed: 1,
        stoppedAt: 1,
        url: 'blob:a',
      });

      publish(bus, renameRecordingWorkflow.resolved, {
        id: 'a',
        name: 'Demo',
      });

      expect(state.recordings[0].name).toBe('Demo');
    });

    it('is a no-op when the id is unknown', () => {
      const { state, bus } = setup();
      publish(bus, stopRecordingWorkflow.resolved, {
        id: 'a',
        elapsed: 1,
        stoppedAt: 1,
        url: 'blob:a',
      });

      publish(bus, renameRecordingWorkflow.resolved, {
        id: 'nope',
        name: 'Demo',
      });

      expect(state.recordings[0].name).toBe('Recording 1');
    });
  });
});
