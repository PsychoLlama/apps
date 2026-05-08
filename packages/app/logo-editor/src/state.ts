import { createStore, defineAction, defineStore, useAction } from '@lib/state';
import { DEFAULT_ICON, type IconRef } from './icons';
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
  /** Selected icon — fully-qualified reference plus rendered body. */
  icon: IconRef;
  /** Active palette — drives both background and foreground via lookup. */
  palette: PaletteName;
  /** Mask applied to the canvas. */
  shape: LogoEditorShape;
  /** Padding as a percentage of the canvas width (`0`–`40`). */
  padding: number;
}

/** Canonical defaults the store starts at and `reset` returns to. */
export const DEFAULT_LOGO_EDITOR_STATE: LogoEditorState = {
  icon: DEFAULT_ICON,
  palette: 'blue',
  shape: 'rounded',
  padding: 10,
};

/** Store handle — internal so consumers reach for the materialized view. */
const logoEditorStore = defineStore<LogoEditorState>(() => ({
  ...DEFAULT_LOGO_EDITOR_STATE,
}));

/** Live, readonly view of the logo under construction. */
export const logoEditor = createStore(logoEditorStore);

const setIconAction = defineAction(
  [logoEditorStore],
  (state, icon: IconRef) => {
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

/**
 * Randomize style fields only. The icon picker handles fetching a
 * random icon (which is async) and dispatches `setIcon` separately —
 * actions stay synchronous, so style + icon are rolled in two steps.
 */
const randomizeStyleAction = defineAction([logoEditorStore], (state) => {
  state.palette = pickFrom(PALETTES).name;
  state.shape = pickFrom(SHAPES);
  state.padding = pickFrom(PADDING_STEPS);
});

/** Subset of {@link LogoEditorState} fields recognized by `hydrate`. */
export interface LogoEditorHydrateInput {
  /** Fully-resolved icon — supplied after async lookup against pack data. */
  icon?: IconRef;
  /** Palette name from the curated set. */
  palette?: string;
  /** Shape mask. */
  shape?: string;
  /** Padding percent (`0`–`40`). */
  padding?: number;
}

const isShape = (value: string): value is LogoEditorShape =>
  (SHAPES as ReadonlyArray<string>).includes(value);

const clampPadding = (value: number): number =>
  Math.max(0, Math.min(40, Math.floor(value)));

/**
 * Resolve a hydrate input into a complete state snapshot. Missing or
 * unparseable fields fall back to {@link DEFAULT_LOGO_EDITOR_STATE} —
 * the URL is the source of truth, so a clean `/logo-editor` link must
 * render the canonical defaults regardless of what the singleton store
 * was holding from a prior session.
 */
export const resolveHydrateInput = (
  input: LogoEditorHydrateInput,
): LogoEditorState => {
  const palette =
    input.palette && findPalette(input.palette) ? input.palette : undefined;
  const shape = input.shape && isShape(input.shape) ? input.shape : undefined;
  const padding =
    input.padding !== undefined && Number.isFinite(input.padding)
      ? clampPadding(input.padding)
      : undefined;
  return {
    icon: input.icon ?? DEFAULT_LOGO_EDITOR_STATE.icon,
    palette: palette ?? DEFAULT_LOGO_EDITOR_STATE.palette,
    shape: shape ?? DEFAULT_LOGO_EDITOR_STATE.shape,
    padding: padding ?? DEFAULT_LOGO_EDITOR_STATE.padding,
  };
};

/**
 * Apply style fields (palette, shape, padding) from a hydrate input.
 * The icon is intentionally not touched — it's expensive to resolve
 * (requires fetching pack data), so callers handle it separately via
 * {@link setIconAction}. Threading the current icon through this
 * action would also create a reactive cycle in any caller that reads
 * `logoEditor.icon` to populate the input.
 */
const hydrateAction = defineAction(
  [logoEditorStore],
  (state, input: LogoEditorHydrateInput) => {
    const resolved = resolveHydrateInput(input);
    state.palette = resolved.palette;
    state.shape = resolved.shape;
    state.padding = resolved.padding;
  },
);

/** Shape returned by {@link useLogoEditorActions}. */
export interface LogoEditorActions {
  setIcon: (icon: IconRef) => void;
  setPalette: (name: PaletteName) => void;
  setShape: (value: LogoEditorShape) => void;
  setPadding: (value: number) => void;
  /** Restore the canonical defaults. */
  reset: () => void;
  /** Roll a fresh palette/shape/padding. Icon is randomized separately. */
  randomizeStyle: () => void;
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
  randomizeStyle: useAction(randomizeStyleAction),
  hydrate: useAction(hydrateAction),
});
