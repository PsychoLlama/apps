import { createTestBindings } from '@lib/state';
import {
  deleteRecording,
  deleteRecordingEffect,
  hydrateLibrary,
  loadRecordingsEffect,
  markLibraryLoadFailed,
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
  vi.mocked(capabilities.removePersistedRecording)
    .mockReset()
    .mockResolvedValue(undefined);
  vi.mocked(capabilities.revokeRecording).mockReset();
});

describe('deleteRecording', () => {
  it('removes a recording by id', () => {
    const { library, useAction } = setup();
    seed(library, [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, size: 0, url: 'blob:a' },
      { id: 'b', name: 'b', duration: 2, createdAt: 2, size: 0, url: 'blob:b' },
    ]);

    useAction(deleteRecording)('a');

    expect(library.recordings.map((recording) => recording.id)).toEqual(['b']);
  });

  it('is a no-op on an unknown id', () => {
    const { library, useAction } = setup();
    seed(library, [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, size: 0, url: 'blob:a' },
    ]);

    useAction(deleteRecording)('nope');

    expect(library.recordings).toHaveLength(1);
  });

  it('tombstones the id while the library is still loading', () => {
    const { library, useAction } = setup();
    seed(library, [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, size: 0, url: 'blob:a' },
    ]);

    useAction(deleteRecording)('a');

    expect(library.tombstones).toContain('a');
  });

  it('does not tombstone once the library has hydrated', () => {
    const { library, useAction } = setup();
    useAction(hydrateLibrary)([
      { id: 'a', name: 'a', duration: 1, createdAt: 1, size: 0, url: 'blob:a' },
    ]);

    useAction(deleteRecording)('a');

    expect(library.tombstones).toEqual([]);
  });
});

describe('deleteRecordingEffect', () => {
  it('removes the persisted entry, revokes the URL, and drops state', async () => {
    const { library, useEffect } = setup();
    seed(library, [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, size: 0, url: 'blob:a' },
    ]);

    await useEffect(deleteRecordingEffect)({ id: 'a', url: 'blob:a' });

    expect(capabilities.removePersistedRecording).toHaveBeenCalledWith('a');
    expect(capabilities.revokeRecording).toHaveBeenCalledWith('blob:a');
    expect(library.recordings).toHaveLength(0);
  });

  it('still drops state and revokes the URL when persistent deletion fails', async () => {
    const { library, useEffect } = setup();
    seed(library, [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, size: 0, url: 'blob:a' },
    ]);
    vi.mocked(capabilities.removePersistedRecording).mockRejectedValueOnce(
      new Error('disk-fail'),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await useEffect(deleteRecordingEffect)({ id: 'a', url: 'blob:a' });

    // In-memory fallback recordings (created when IDB was unavailable
    // for the persist) must still be deletable. State is the user's
    // intent; the warning surfaces the persist-side miss.
    expect(library.recordings).toHaveLength(0);
    expect(capabilities.revokeRecording).toHaveBeenCalledWith('blob:a');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('remove'),
      expect.any(Error),
    );
    warn.mockRestore();
  });
});

describe('hydrateLibrary', () => {
  it('appends the persisted set, sorts by createdAt, and marks loaded', () => {
    const { library, useAction } = setup();
    seed(library, [
      {
        id: 'mid',
        name: 'mid',
        duration: 5,
        createdAt: 200,
        size: 0,
        url: 'blob:mid',
      },
    ]);

    useAction(hydrateLibrary)([
      {
        id: 'older',
        name: 'older',
        duration: 3,
        createdAt: 100,
        size: 0,
        url: 'blob:older',
      },
    ]);

    expect(library.recordings.map((entry) => entry.id)).toEqual([
      'older',
      'mid',
    ]);
    expect(library.loaded).toBe(true);
  });

  it('skips when the library is already loaded and revokes the dropped URLs', () => {
    const { library, useAction } = setup();
    useAction(hydrateLibrary)([
      { id: 'a', name: 'a', duration: 1, createdAt: 1, size: 0, url: 'blob:a' },
    ]);

    useAction(hydrateLibrary)([
      {
        id: 'b',
        name: 'b',
        duration: 2,
        createdAt: 2,
        size: 0,
        url: 'blob:dropped',
      },
    ]);

    expect(library.recordings.map((entry) => entry.id)).toEqual(['a']);
    // Plugs the microtask race where two hydrates resolve before
    // either dispatches; the loser's filter saw stale empty state and
    // would otherwise stash its URLs here on the floor.
    expect(capabilities.revokeRecording).toHaveBeenCalledWith('blob:dropped');
  });

  it('ignores a null payload from a short-circuited effect', () => {
    const { library, useAction } = setup();

    useAction(hydrateLibrary)(null);

    expect(library.recordings).toEqual([]);
    expect(library.loaded).toBe(false);
  });
});

describe('markLibraryLoadFailed', () => {
  it('logs the failure and marks the library loaded so we stop retrying', () => {
    const { library, useAction } = setup();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    useAction(markLibraryLoadFailed)(new Error('idb-blocked'));

    expect(library.loaded).toBe(true);
    expect(library.recordings).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('hydrate'),
      expect.any(Error),
    );
    warn.mockRestore();
  });
});

describe('loadRecordingsEffect', () => {
  it('reads from disk on the first call and dispatches hydrate', async () => {
    const { library, useEffect } = setup();
    const persisted: Recording[] = [
      { id: 'a', name: 'a', duration: 1, createdAt: 1, size: 0, url: 'blob:a' },
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

  it('revokes the freshly-minted URL for any recording already in state', async () => {
    const { library, useEffect } = setup();
    seed(library, [
      {
        id: 'mid',
        name: 'mid',
        duration: 5,
        createdAt: 200,
        size: 0,
        url: 'blob:in-memory',
      },
    ]);
    vi.mocked(capabilities.loadRecordings).mockResolvedValueOnce([
      {
        id: 'mid',
        name: 'mid',
        duration: 5,
        createdAt: 200,
        size: 0,
        url: 'blob:from-disk',
      },
      {
        id: 'older',
        name: 'older',
        duration: 3,
        createdAt: 100,
        size: 0,
        url: 'blob:older',
      },
    ]);

    await useEffect(loadRecordingsEffect)();

    expect(capabilities.revokeRecording).toHaveBeenCalledWith('blob:from-disk');
    expect(library.recordings.map((entry) => entry.url)).toEqual([
      'blob:older',
      'blob:in-memory',
    ]);
  });

  it('skips and revokes recordings tombstoned during the in-flight load', async () => {
    const { library, useEffect, useAction } = setup();
    // Simulate: hydrate begins, then user deletes 'gone' before the
    // IDB read resolves with a snapshot that still includes it.
    useAction(deleteRecording)('gone');
    vi.mocked(capabilities.loadRecordings).mockResolvedValueOnce([
      {
        id: 'gone',
        name: 'gone',
        duration: 1,
        createdAt: 1,
        size: 0,
        url: 'blob:resurrected',
      },
      {
        id: 'kept',
        name: 'kept',
        duration: 2,
        createdAt: 2,
        size: 0,
        url: 'blob:kept',
      },
    ]);

    await useEffect(loadRecordingsEffect)();

    expect(capabilities.revokeRecording).toHaveBeenCalledWith(
      'blob:resurrected',
    );
    expect(library.recordings.map((entry) => entry.id)).toEqual(['kept']);
    expect(library.tombstones).toEqual([]);
  });

  it('marks loaded and logs when IndexedDB read fails', async () => {
    const { library, useEffect } = setup();
    vi.mocked(capabilities.loadRecordings).mockRejectedValueOnce(
      new Error('idb-blocked'),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await useEffect(loadRecordingsEffect)();

    expect(library.loaded).toBe(true);
    expect(library.recordings).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('hydrate'),
      expect.any(Error),
    );
    warn.mockRestore();
  });
});
