import { createStore, defineStore } from '#state';
import type { Recording } from './types';

export interface LibraryState {
  recordings: Recording[];
}

export const libraryStore = defineStore<LibraryState>(() => ({
  recordings: [],
}));

// Self-bootstrap so module imports expose a live readonly view.
export const library = createStore(libraryStore);
