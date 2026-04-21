import { createStore, defineStore, GLOBAL_REGISTRY } from '#state/next';
import type { Recording } from './types';

export interface LibraryState {
  recordings: Recording[];
}

export const libraryStore = defineStore<LibraryState>(() => ({
  recordings: [],
}));

// Self-bootstrap against the global registry so module imports expose a
// live readonly view.
export const library = createStore(GLOBAL_REGISTRY, libraryStore);
