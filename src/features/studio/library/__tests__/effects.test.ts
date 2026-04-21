import { vi } from 'vitest';
import { bindRegistry, createRegistry, createStore } from '#state';
import { addRecording } from '../actions';
import { deleteRecordingEffect } from '../effects';
import { libraryStore } from '../store';

function setup() {
  const registry = createRegistry();
  const bound = bindRegistry(registry);
  createStore(registry, libraryStore);
  return { ...bound, state: bound.useStore(libraryStore) };
}

describe('deleteRecordingEffect', () => {
  it('revokes the blob URL', () => {
    const { useEffect } = setup();
    const spy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined);

    useEffect(deleteRecordingEffect)({ id: 'rec-1', url: 'blob:abc' });

    expect(spy).toHaveBeenCalledWith('blob:abc');
    spy.mockRestore();
  });

  it('removes the recording from the library on success', () => {
    const { state, useAction, useEffect } = setup();
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    useAction(addRecording)({
      id: 'rec-1',
      elapsed: 1,
      stoppedAt: 1,
      url: 'blob:abc',
    });
    expect(state.recordings).toHaveLength(1);

    useEffect(deleteRecordingEffect)({ id: 'rec-1', url: 'blob:abc' });

    expect(state.recordings).toHaveLength(0);
    vi.restoreAllMocks();
  });
});
