import { createStore, defineStore } from '@lib/state';
import type { Recording } from './types';

/** Catalog of recordings captured during this session. */
export interface LibraryState {
  /** Recordings in capture order. Most-recent first is a view concern. */
  recordings: Recording[];
  /** True once the library has been hydrated from persistent storage. */
  loaded: boolean;
}

export const libraryStore = defineStore<LibraryState>(() => ({
  recordings: [],
  loaded: false,
}));

// Self-bootstrap so module imports expose a live readonly view.
export const library = createStore(libraryStore);
