import { createStore, defineAction, defineStore, useAction } from '@lib/state';
import { ICONS, findIcon, type IconEntry } from './icons';
import { PALETTES, findPalette, type PaletteName } from './palette';

/** Available shape masks for the logo canvas. */
export type LogoEditorShape = 'square' | 'rounded' | 'squircle' | 'circle';

const SHAPES: ReadonlyArray<LogoEditorShape> = [
  'square',
  'rounded',
  'squircle',
  'circle',
];

/** Snapshot of every input that affects the rendered logo. */
export interface LogoEditorState {
  /** Selected icon entry from the curated MDI set. */
  icon: IconEntry;
  /** Active palette — drives both background and foreground via lookup. */
  palette: PaletteName;
  /** Mask applied to the canvas. */
  shape: LogoEditorShape;
  /** Padding as a percentage of the canvas width (`0`–`40`). */
  padding: number;
}

/** Canonical defaults the store starts at and `reset` returns to. */
export const DEFAULT_LOGO_EDITOR_STATE: LogoEditorState = {
  icon: findIcon('home') ?? ICONS[0],
  palette: 'blue',
  shape: 'rounded',
  padding: 18,
};

/** Store handle — internal so consumers reach for the materialized view. */
const logoEditorStore = defineStore<LogoEditorState>(() => ({
  ...DEFAULT_LOGO_EDITOR_STATE,
}));

/** Live, readonly view of the logo under construction. */
export const logoEditor = createStore(logoEditorStore);

const setIconAction = defineAction(
  [logoEditorStore],
  (state, icon: IconEntry) => {
    state.icon = icon;
  },
);

const setPaletteAction = defineAction(
  [logoEditorStore],
  (state, name: PaletteName) => {
    if (findPalette(name)) state.palette = name;
  },
);

const setShapeAction = defineAction(
  [logoEditorStore],
  (state, value: LogoEditorShape) => {
    state.shape = value;
  },
);

const setPaddingAction = defineAction(
  [logoEditorStore],
  (state, value: number) => {
    state.padding = value;
  },
);

const resetAction = defineAction([logoEditorStore], (state) => {
  Object.assign(state, DEFAULT_LOGO_EDITOR_STATE);
});

const pickFrom = <T>(arr: ReadonlyArray<T>): T =>
  arr[Math.floor(Math.random() * arr.length)];

/** Padding presets `randomize` chooses from — 10% steps across the slider. */
const PADDING_STEPS = [0, 10, 20, 30, 40] as const;

const randomizeAction = defineAction([logoEditorStore], (state) => {
  state.icon = pickFrom(ICONS);
  state.palette = pickFrom(PALETTES).name;
  state.shape = pickFrom(SHAPES);
  state.padding = pickFrom(PADDING_STEPS);
});

/** Subset of {@link LogoEditorState} fields recognized by `hydrate`. */
export interface LogoEditorHydrateInput {
  /** Icon name from the curated MDI set. */
  icon?: string;
  /** Palette name from the curated set. */
  palette?: string;
  /** Shape mask. */
  shape?: string;
  /** Padding percent (`0`–`40`). */
  padding?: number;
}

const isShape = (value: string): value is LogoEditorShape =>
  (SHAPES as ReadonlyArray<string>).includes(value);

/**
 * Apply each provided field to the store after lightweight validation.
 * Unrecognized fields and unparseable values are ignored — the existing
 * value wins. Used to seed the store from URL search params.
 */
const hydrateAction = defineAction(
  [logoEditorStore],
  (state, input: LogoEditorHydrateInput) => {
    if (input.icon) {
      const found = findIcon(input.icon);
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

/** Shape returned by {@link useLogoEditorActions}. */
export interface LogoEditorActions {
  setIcon: (icon: IconEntry) => void;
  setPalette: (name: PaletteName) => void;
  setShape: (value: LogoEditorShape) => void;
  setPadding: (value: number) => void;
  /** Restore the canonical defaults. */
  reset: () => void;
  /** Roll a fresh random logo. */
  randomize: () => void;
  /** Apply validated fields from a partial input (e.g. URL params). */
  hydrate: (input: LogoEditorHydrateInput) => void;
}

/** Bind the logo-editor actions inside a component scope. */
export const useLogoEditorActions = (): LogoEditorActions => ({
  setIcon: useAction(setIconAction),
  setPalette: useAction(setPaletteAction),
  setShape: useAction(setShapeAction),
  setPadding: useAction(setPaddingAction),
  reset: useAction(resetAction),
  randomize: useAction(randomizeAction),
  hydrate: useAction(hydrateAction),
});
