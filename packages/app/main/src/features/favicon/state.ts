import { createStore, defineAction, defineStore, useAction } from '@lib/state';
import { ICONS, type IconEntry } from './icons';
import { PALETTES, findPalette, type PaletteName } from './palette';

/** Available shape masks for the favicon canvas. */
export type FaviconShape = 'square' | 'rounded' | 'squircle' | 'circle';

const SHAPES: ReadonlyArray<FaviconShape> = [
  'square',
  'rounded',
  'squircle',
  'circle',
];

/** Snapshot of every input that affects the rendered favicon. */
export interface FaviconState {
  /** Selected icon entry from the curated MDI set. */
  icon: IconEntry;
  /** Active palette — drives both background and foreground via lookup. */
  palette: PaletteName;
  /** Mask applied to the canvas. */
  shape: FaviconShape;
  /** Padding as a percentage of the canvas width (`0`–`40`). */
  padding: number;
}

/** Canonical defaults the store starts at and `reset` returns to. */
export const DEFAULT_FAVICON_STATE: FaviconState = {
  icon: ICONS[0],
  palette: 'blue',
  shape: 'rounded',
  padding: 18,
};

/** Store handle — internal so consumers reach for the materialized view. */
const faviconStore = defineStore<FaviconState>(() => ({
  ...DEFAULT_FAVICON_STATE,
}));

/** Live, readonly view of the favicon under construction. */
export const favicon = createStore(faviconStore);

const setIconAction = defineAction([faviconStore], (state, icon: IconEntry) => {
  state.icon = icon;
});

const setPaletteAction = defineAction(
  [faviconStore],
  (state, name: PaletteName) => {
    if (findPalette(name)) state.palette = name;
  },
);

const setShapeAction = defineAction(
  [faviconStore],
  (state, value: FaviconShape) => {
    state.shape = value;
  },
);

const setPaddingAction = defineAction(
  [faviconStore],
  (state, value: number) => {
    state.padding = value;
  },
);

const resetAction = defineAction([faviconStore], (state) => {
  Object.assign(state, DEFAULT_FAVICON_STATE);
});

const pickFrom = <T>(arr: ReadonlyArray<T>): T =>
  arr[Math.floor(Math.random() * arr.length)];

/** Padding presets `randomize` chooses from — 10% steps across the slider. */
const PADDING_STEPS = [0, 10, 20, 30, 40] as const;

const randomizeAction = defineAction([faviconStore], (state) => {
  state.icon = pickFrom(ICONS);
  state.palette = pickFrom(PALETTES).name;
  state.shape = pickFrom(SHAPES);
  state.padding = pickFrom(PADDING_STEPS);
});

/** Subset of `FaviconState` fields recognized by `hydrate`. */
export interface FaviconHydrateInput {
  /** Icon name from the curated MDI set. */
  icon?: string;
  /** Palette name from the curated set. */
  palette?: string;
  /** Shape mask. */
  shape?: string;
  /** Padding percent (`0`–`40`). */
  padding?: number;
}

const ICONS_BY_NAME = new Map(ICONS.map((entry) => [entry.name, entry]));
const isShape = (value: string): value is FaviconShape =>
  (SHAPES as ReadonlyArray<string>).includes(value);

/**
 * Apply each provided field to the store after lightweight validation.
 * Unrecognized fields and unparseable values are ignored — the existing
 * value wins. Used to seed the store from URL search params.
 */
const hydrateAction = defineAction(
  [faviconStore],
  (state, input: FaviconHydrateInput) => {
    if (input.icon) {
      const found = ICONS_BY_NAME.get(input.icon);
      if (found) state.icon = found;
    }
    if (input.palette && findPalette(input.palette)) {
      state.palette = input.palette;
    }
    if (input.shape && isShape(input.shape)) {
      state.shape = input.shape;
    }
    if (input.padding !== undefined && Number.isFinite(input.padding)) {
      state.padding = Math.max(0, Math.min(40, Math.floor(input.padding)));
    }
  },
);

/** Shape returned by {@link useFaviconActions}. */
export interface FaviconActions {
  setIcon: (icon: IconEntry) => void;
  setPalette: (name: PaletteName) => void;
  setShape: (value: FaviconShape) => void;
  setPadding: (value: number) => void;
  /** Restore the canonical defaults. */
  reset: () => void;
  /** Roll a fresh random favicon. */
  randomize: () => void;
  /** Apply validated fields from a partial input (e.g. URL params). */
  hydrate: (input: FaviconHydrateInput) => void;
}

/** Bind the favicon actions inside a component scope. */
export const useFaviconActions = (): FaviconActions => ({
  setIcon: useAction(setIconAction),
  setPalette: useAction(setPaletteAction),
  setShape: useAction(setShapeAction),
  setPadding: useAction(setPaddingAction),
  reset: useAction(resetAction),
  randomize: useAction(randomizeAction),
  hydrate: useAction(hydrateAction),
});
