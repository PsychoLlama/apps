import { createStore, defineAction, defineStore, useAction } from '@lib/state';
import { type IconRef } from './icons';
import { PALETTES, findPalette, type PaletteName } from './palette';

/** Available shape masks for the icon canvas. */
export type IconEditorShape = 'square' | 'rounded' | 'squircle' | 'circle';

const SHAPES: ReadonlyArray<IconEditorShape> = [
  'square',
  'rounded',
  'squircle',
  'circle',
];

/** Snapshot of every input that affects the rendered icon. */
export interface IconEditorState {
  /**
   * Selected icon — fully-qualified reference plus rendered body, or
   * `undefined` while no icon is chosen yet. The empty state renders
   * the blueprint placeholder instead.
   */
  icon: IconRef | undefined;
  /** Active palette — drives both background and foreground via lookup. */
  palette: PaletteName;
  /** Mask applied to the canvas. */
  shape: IconEditorShape;
  /** Padding as a percentage of the canvas width (`0`–`40`). */
  padding: number;
}

/** Canonical defaults the store starts at and `reset` returns to. */
export const DEFAULT_ICON_EDITOR_STATE: IconEditorState = {
  icon: undefined,
  palette: 'blue',
  shape: 'rounded',
  padding: 10,
};

/** Store handle — internal so consumers reach for the materialized view. */
const iconEditorStore = defineStore<IconEditorState>(() => ({
  ...DEFAULT_ICON_EDITOR_STATE,
}));

/** Live, readonly view of the icon under construction. */
export const iconEditor = createStore(iconEditorStore);

const setIconAction = defineAction(
  [iconEditorStore],
  (state, icon: IconRef | undefined) => {
    state.icon = icon;
  },
);

const setPaletteAction = defineAction(
  [iconEditorStore],
  (state, name: PaletteName) => {
    if (findPalette(name)) state.palette = name;
  },
);

const setShapeAction = defineAction(
  [iconEditorStore],
  (state, value: IconEditorShape) => {
    state.shape = value;
  },
);

const setPaddingAction = defineAction(
  [iconEditorStore],
  (state, value: number) => {
    state.padding = value;
  },
);

const resetAction = defineAction([iconEditorStore], (state) => {
  Object.assign(state, DEFAULT_ICON_EDITOR_STATE);
});

const pickFrom = <T>(arr: ReadonlyArray<T>): T =>
  arr[Math.floor(Math.random() * arr.length)];

/** Padding presets `randomize` chooses from — 10% steps across the slider. */
const PADDING_STEPS = [0, 10, 20, 30, 40] as const;

/**
 * Randomize style fields only. The icon picker handles fetching a
 * random icon (which is async) and dispatches `setIcon` separately —
 * actions stay synchronous, so style + icon are rolled in two steps.
 */
const randomizeStyleAction = defineAction([iconEditorStore], (state) => {
  state.palette = pickFrom(PALETTES).name;
  state.shape = pickFrom(SHAPES);
  state.padding = pickFrom(PADDING_STEPS);
});

/** Subset of {@link IconEditorState} fields recognized by `hydrate`. */
export interface IconEditorHydrateInput {
  /** Fully-resolved icon — supplied after async lookup against pack data. */
  icon?: IconRef;
  /** Palette name from the curated set. */
  palette?: string;
  /** Shape mask. */
  shape?: string;
  /** Padding percent (`0`–`40`). */
  padding?: number;
}

const isShape = (value: string): value is IconEditorShape =>
  (SHAPES as ReadonlyArray<string>).includes(value);

const clampPadding = (value: number): number =>
  Math.max(0, Math.min(40, Math.floor(value)));

/**
 * Resolve a hydrate input into a complete state snapshot. Missing or
 * unparseable fields fall back to {@link DEFAULT_ICON_EDITOR_STATE} —
 * the URL is the source of truth, so a clean `/icon-editor` link must
 * render the canonical defaults regardless of what the singleton store
 * was holding from a prior session.
 */
export const resolveHydrateInput = (
  input: IconEditorHydrateInput,
): IconEditorState => {
  const palette =
    input.palette && findPalette(input.palette) ? input.palette : undefined;
  const shape = input.shape && isShape(input.shape) ? input.shape : undefined;
  const padding =
    input.padding !== undefined && Number.isFinite(input.padding)
      ? clampPadding(input.padding)
      : undefined;
  return {
    icon: input.icon ?? DEFAULT_ICON_EDITOR_STATE.icon,
    palette: palette ?? DEFAULT_ICON_EDITOR_STATE.palette,
    shape: shape ?? DEFAULT_ICON_EDITOR_STATE.shape,
    padding: padding ?? DEFAULT_ICON_EDITOR_STATE.padding,
  };
};

/**
 * Apply style fields (palette, shape, padding) from a hydrate input.
 * The icon is intentionally not touched — it's expensive to resolve
 * (requires fetching pack data), so callers handle it separately via
 * {@link setIconAction}. Threading the current icon through this
 * action would also create a reactive cycle in any caller that reads
 * `iconEditor.icon` to populate the input.
 */
const hydrateAction = defineAction(
  [iconEditorStore],
  (state, input: IconEditorHydrateInput) => {
    const resolved = resolveHydrateInput(input);
    state.palette = resolved.palette;
    state.shape = resolved.shape;
    state.padding = resolved.padding;
  },
);

/** Shape returned by {@link useIconEditorActions}. */
export interface IconEditorActions {
  setIcon: (icon: IconRef | undefined) => void;
  setPalette: (name: PaletteName) => void;
  setShape: (value: IconEditorShape) => void;
  setPadding: (value: number) => void;
  /** Restore the canonical defaults. */
  reset: () => void;
  /** Roll a fresh palette/shape/padding. Icon is randomized separately. */
  randomizeStyle: () => void;
  /** Apply validated fields from a partial input (e.g. URL params). */
  hydrate: (input: IconEditorHydrateInput) => void;
}

/** Bind the icon-editor actions inside a component scope. */
export const useIconEditorActions = (): IconEditorActions => ({
  setIcon: useAction(setIconAction),
  setPalette: useAction(setPaletteAction),
  setShape: useAction(setShapeAction),
  setPadding: useAction(setPaddingAction),
  reset: useAction(resetAction),
  randomizeStyle: useAction(randomizeStyleAction),
  hydrate: useAction(hydrateAction),
});
