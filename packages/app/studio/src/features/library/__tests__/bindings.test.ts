import { createTestBindings } from '@lib/state';
import {
  deleteRecording,
  deleteRecordingEffect,
  hydrateLibrary,
  loadRecordingsEffect,
} from '../bindings';
import * as capabilities from '../capabilities';
import { libraryStore } from '../store';
import type { Recording } from '../types';

vi.mock('../capabilities', () => ({
  loadRecordings: vi.fn(),
  persistRecording: vi.fn(),
  removePersistedRecording: vi.fn().mockResolvedValue(undefined),
  revokeRecording: vi.fn(),
}));

const setup = () => {
  const bindings = createTestBindings();
  return { ...bindings, library: bindings.createStore(libraryStore) };
};

const seed = (
  library: { recordings: readonly Recording[] },
  recordings: Recording[],
): void => {
  (library.recordings as Recording[]).push(...recordings);
};

beforeEach(() => {
  vi.mocked(capabilities.loadRecordings).mockReset();
  vi.mocked(capabilities.removePersistedRecording).mockClear();
  vi.mocked(capabilities.revokeRecording).mockClear();
});

describe('deleteRecording', () => {
  it('removes a recording by id', () => {
    const { library, useAction } = setup();
    seed(library, [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, url: 'blob:a' },
      { id: 'b', name: 'b', duration: 2, createdAt: 2, url: 'blob:b' },
    ]);

    useAction(deleteRecording)('a');

    expect(library.recordings.map((recording) => recording.id)).toEqual(['b']);
  });

  it('is a no-op on an unknown id', () => {
    const { library, useAction } = setup();
    seed(library, [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, url: 'blob:a' },
    ]);

    useAction(deleteRecording)('nope');

    expect(library.recordings).toHaveLength(1);
  });
});

describe('deleteRecordingEffect', () => {
  it('removes the persisted entry, revokes the URL, and drops state', async () => {
    const { library, useEffect } = setup();
    seed(library, [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, url: 'blob:a' },
    ]);

    await useEffect(deleteRecordingEffect)({ id: 'a', url: 'blob:a' });

    expect(capabilities.removePersistedRecording).toHaveBeenCalledWith('a');
    expect(capabilities.revokeRecording).toHaveBeenCalledWith('blob:a');
    expect(library.recordings).toHaveLength(0);
  });

  it('leaves state alone when persistent deletion fails', async () => {
    const { library, useEffect } = setup();
    seed(library, [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, url: 'blob:a' },
    ]);
    vi.mocked(capabilities.removePersistedRecording).mockRejectedValueOnce(
      new Error('disk-fail'),
    );

    await expect(
      useEffect(deleteRecordingEffect)({ id: 'a', url: 'blob:a' }),
    ).rejects.toThrow('disk-fail');

    expect(capabilities.revokeRecording).not.toHaveBeenCalled();
    expect(library.recordings).toHaveLength(1);
  });
});

describe('hydrateLibrary', () => {
  it('seeds the recordings array and marks the library loaded', () => {
    const { library, useAction } = setup();
    const recordings: Recording[] = [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, url: 'blob:a' },
    ];

    useAction(hydrateLibrary)(recordings);

    expect(library.recordings).toEqual(recordings);
    expect(library.loaded).toBe(true);
  });

  it('preserves recordings appended while the IDB read was in flight', () => {
    const { library, useAction } = setup();
    // Simulate a recording captured + added to state before the
    // hydrate snapshot resolves.
    seed(library, [
      {
        id: 'mid-flight',
        name: 'live',
        duration: 5,
        createdAt: 200,
        url: 'blob:live',
      },
    ]);

    useAction(hydrateLibrary)([
      {
        id: 'older',
        name: 'older',
        duration: 3,
        createdAt: 100,
        url: 'blob:older',
      },
    ]);

    expect(library.recordings.map((entry) => entry.id)).toEqual([
      'older',
      'mid-flight',
    ]);
    expect(library.loaded).toBe(true);
  });

  it('does not duplicate recordings that already exist in state', () => {
    const { library, useAction } = setup();
    seed(library, [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, url: 'blob:fresh' },
    ]);

    useAction(hydrateLibrary)([
      { id: 'a', name: 'a', duration: 1, createdAt: 1, url: 'blob:stale' },
    ]);

    expect(library.recordings).toHaveLength(1);
    expect(library.recordings[0].url).toBe('blob:fresh');
  });

  it('skips when the library is already loaded', () => {
    const { library, useAction } = setup();
    const initial: Recording[] = [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, url: 'blob:a' },
    ];
    useAction(hydrateLibrary)(initial);

    useAction(hydrateLibrary)([
      { id: 'b', name: 'b', duration: 2, createdAt: 2, url: 'blob:b' },
    ]);

    expect(library.recordings.map((entry) => entry.id)).toEqual(['a']);
  });

  it('ignores a null payload from a short-circuited effect', () => {
    const { library, useAction } = setup();

    useAction(hydrateLibrary)(null);

    expect(library.recordings).toEqual([]);
    expect(library.loaded).toBe(false);
  });
});

describe('loadRecordingsEffect', () => {
  it('reads from disk on the first call and dispatches hydrate', async () => {
    const { library, useEffect } = setup();
    const persisted: Recording[] = [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, url: 'blob:a' },
    ];
    vi.mocked(capabilities.loadRecordings).mockResolvedValueOnce(persisted);

    await useEffect(loadRecordingsEffect)();

    expect(capabilities.loadRecordings).toHaveBeenCalledOnce();
    expect(library.recordings).toEqual(persisted);
    expect(library.loaded).toBe(true);
  });

  it('short-circuits when the library is already loaded', async () => {
    const { useEffect } = setup();
    vi.mocked(capabilities.loadRecordings).mockResolvedValue([]);
    await useEffect(loadRecordingsEffect)();

    await useEffect(loadRecordingsEffect)();

    expect(capabilities.loadRecordings).toHaveBeenCalledOnce();
  });
});
