import { createTestBindings } from '@psychollama/state';
import { deleteRecording } from '../bindings';
import { libraryStore } from '../store';
import type { Recording } from '../types';

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
