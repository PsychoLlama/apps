import { vi } from 'vitest';
import { createTestBindings } from '#state';
import * as capabilities from '../capabilities';
import { deleteRecording, deleteRecordingEffect } from '../bindings';
import { libraryStore } from '../store';
import type { Recording } from '../types';

vi.mock('../capabilities', async () => {
  const actual = await vi.importActual<typeof capabilities>('../capabilities');
  return {
    ...actual,
    revokeRecording: vi.fn(),
  };
});

function setup() {
  const bindings = createTestBindings();
  return { ...bindings, library: bindings.createStore(libraryStore) };
}

function seed(
  library: { recordings: readonly Recording[] },
  recordings: Recording[],
): void {
  (library.recordings as Recording[]).push(...recordings);
}

beforeEach(() => {
  vi.mocked(capabilities.revokeRecording).mockReset();
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
  it('revokes the blob URL', () => {
    const { useEffect } = setup();

    useEffect(deleteRecordingEffect)({ id: 'rec-1', url: 'blob:abc' });

    expect(capabilities.revokeRecording).toHaveBeenCalledWith('blob:abc');
  });

  it('removes the recording from the library on success', () => {
    const { library, useEffect } = setup();
    seed(library, [
      {
        id: 'rec-1',
        name: 'rec-1',
        duration: 1,
        createdAt: 1,
        url: 'blob:abc',
      },
    ]);

    useEffect(deleteRecordingEffect)({ id: 'rec-1', url: 'blob:abc' });

    expect(library.recordings).toHaveLength(0);
  });
});
