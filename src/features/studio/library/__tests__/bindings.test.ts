import { vi } from 'vitest';
import { bindRegistry, createRegistry, createStore } from '#state';
import * as capabilities from '../capabilities';
import {
  addRecording,
  deleteRecording,
  deleteRecordingEffect,
} from '../bindings';
import { libraryStore } from '../store';

vi.mock('../capabilities', async () => {
  const actual = await vi.importActual<typeof capabilities>('../capabilities');
  return {
    ...actual,
    revokeRecording: vi.fn(),
  };
});

function setup() {
  const registry = createRegistry();
  const bound = bindRegistry(registry);
  createStore(registry, libraryStore);
  return { ...bound, library: bound.useStore(libraryStore) };
}

beforeEach(() => {
  vi.mocked(capabilities.revokeRecording).mockReset();
});

describe('addRecording', () => {
  it('appends a recording with an auto-numbered name', () => {
    const { library, useAction } = setup();

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

    expect(library.recordings.map((r) => r.name)).toEqual([
      'Recording 1',
      'Recording 2',
    ]);
  });

  it('preserves elapsed, stoppedAt, and url', () => {
    const { library, useAction } = setup();

    useAction(addRecording)({
      id: 'rec-1',
      elapsed: 300,
      stoppedAt: 1713200000000,
      url: 'blob:download',
    });

    expect(library.recordings[0]).toEqual({
      id: 'rec-1',
      name: 'Recording 1',
      duration: 300,
      createdAt: 1713200000000,
      url: 'blob:download',
    });
  });
});

describe('deleteRecording', () => {
  it('removes a recording by id', () => {
    const { library, useAction } = setup();
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

    expect(library.recordings.map((r) => r.id)).toEqual(['b']);
  });

  it('is a no-op on an unknown id', () => {
    const { library, useAction } = setup();
    useAction(addRecording)({
      id: 'a',
      elapsed: 1,
      stoppedAt: 1,
      url: 'blob:a',
    });

    useAction(deleteRecording)('nope');

    expect(library.recordings).toHaveLength(1);
  });
});

describe('deleteRecordingEffect', () => {
  it('revokes the blob URL', () => {
    const { useEffect } = setup();

    useEffect(deleteRecordingEffect)({ id: 'rec-1', url: 'blob:abc' });

    expect(capabilities.revokeRecording).toHaveBeenCalledWith('blob:abc');
  });

  it('removes the recording from the library on success', () => {
    const { library, useAction, useEffect } = setup();
    useAction(addRecording)({
      id: 'rec-1',
      elapsed: 1,
      stoppedAt: 1,
      url: 'blob:abc',
    });

    useEffect(deleteRecordingEffect)({ id: 'rec-1', url: 'blob:abc' });

    expect(library.recordings).toHaveLength(0);
  });
});
