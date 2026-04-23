import { createStore, defineStore } from '@lib/state';
import type { Recording } from './types';

/** Catalog of recordings captured during this session. */
export interface LibraryState {
  /** Recordings in capture order. Most-recent first is a view concern. */
  recordings: Recording[];
  /** True once the library has been hydrated from persistent storage. */
  loaded: boolean;
  /**
   * Ids deleted before the initial hydrate finishes. Lets the hydrate
   * skip recordings that were removed while its IDB read was in
   * flight, which would otherwise resurrect them. Cleared once
   * `loaded` flips so the list never grows during normal use.
   */
  tombstones: string[];
}

export const libraryStore = defineStore<LibraryState>(() => ({
  recordings: [],
  loaded: false,
  tombstones: [],
}));

// Self-bootstrap so module imports expose a live readonly view.
export const library = createStore(libraryStore);
