import { bindRegistry, createRegistry, createStore } from '#state';
import { addRecording, deleteRecording, renameRecording } from '../actions';
import { libraryStore } from '../store';

function setup() {
  const registry = createRegistry();
  const bound = bindRegistry(registry);
  createStore(registry, libraryStore);
  return { ...bound, state: bound.useStore(libraryStore) };
}

describe('libraryStore', () => {
  it('initializes with an empty recording list', () => {
    const { state } = setup();

    expect(state.recordings).toEqual([]);
  });

  describe('addRecording', () => {
    it('appends a recording', () => {
      const { state, useAction } = setup();

      useAction(addRecording)({
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
      const { state, useAction } = setup();

      useAction(addRecording)({
        id: 'a',
        elapsed: 60,
        stoppedAt: 1000,
        url: 'blob:a',
      });
      useAction(addRecording)({
        id: 'b',
        elapsed: 90,
        stoppedAt: 2000,
        url: 'blob:b',
      });
      useAction(addRecording)({
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

    it('preserves elapsed, timestamp, and url', () => {
      const { state, useAction } = setup();

      useAction(addRecording)({
        id: 'rec-1',
        elapsed: 300,
        stoppedAt: 1713200000000,
        url: 'blob:download',
      });

      expect(state.recordings[0].duration).toBe(300);
      expect(state.recordings[0].createdAt).toBe(1713200000000);
      expect(state.recordings[0].url).toBe('blob:download');
    });
  });

  describe('deleteRecording', () => {
    it('removes a recording by id', () => {
      const { state, useAction } = setup();
      useAction(addRecording)({
        id: 'a',
        elapsed: 1,
        stoppedAt: 1,
        url: 'blob:a',
      });
      useAction(addRecording)({
        id: 'b',
        elapsed: 2,
        stoppedAt: 2,
        url: 'blob:b',
      });

      useAction(deleteRecording)('a');

      expect(state.recordings.map((r) => r.id)).toEqual(['b']);
    });

    it('is a no-op when the id is unknown', () => {
      const { state, useAction } = setup();
      useAction(addRecording)({
        id: 'a',
        elapsed: 1,
        stoppedAt: 1,
        url: 'blob:a',
      });

      useAction(deleteRecording)('nope');

      expect(state.recordings).toHaveLength(1);
    });
  });

  describe('renameRecording', () => {
    it('updates the recording name by id', () => {
      const { state, useAction } = setup();
      useAction(addRecording)({
        id: 'a',
        elapsed: 1,
        stoppedAt: 1,
        url: 'blob:a',
      });

      useAction(renameRecording)({ id: 'a', name: 'Demo' });

      expect(state.recordings[0].name).toBe('Demo');
    });

    it('is a no-op when the id is unknown', () => {
      const { state, useAction } = setup();
      useAction(addRecording)({
        id: 'a',
        elapsed: 1,
        stoppedAt: 1,
        url: 'blob:a',
      });

      useAction(renameRecording)({ id: 'nope', name: 'Demo' });

      expect(state.recordings[0].name).toBe('Recording 1');
    });
  });
});
