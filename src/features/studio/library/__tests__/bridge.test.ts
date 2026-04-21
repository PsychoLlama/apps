import { GLOBAL_EVENT_BUS, publish } from '#state';
import { GLOBAL_REGISTRY, createStore, destroyStore } from '#state/next';
import { stopRecordingWorkflow } from '../../session/workflows';
import '../bridge';
import { libraryStore, type LibraryState } from '../store';

describe('library bridge (session → library)', () => {
  let library: ReturnType<typeof createStore<LibraryState>>;

  beforeEach(() => {
    destroyStore(GLOBAL_REGISTRY, libraryStore);
    library = createStore(GLOBAL_REGISTRY, libraryStore);
  });

  it('appends a recording on stopRecordingWorkflow.resolved', () => {
    publish(GLOBAL_EVENT_BUS, stopRecordingWorkflow.resolved, {
      id: 'rec-1',
      elapsed: 120,
      stoppedAt: 1000,
      url: 'blob:abc',
    });

    expect(library.recordings).toHaveLength(1);
    expect(library.recordings[0]).toEqual({
      id: 'rec-1',
      name: 'Recording 1',
      duration: 120,
      createdAt: 1000,
      url: 'blob:abc',
    });
  });
});
