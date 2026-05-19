import {
  createStore,
  defineAction,
  defineEffect,
  defineStore,
} from '@lib/state';
import type { DeepReadonly } from '@lib/state';
import {
  loadIconPackIndex,
  loadIconPackManifest,
  loadIconPage,
  resolveIconRef,
  toIconRef,
  type IconRef,
} from './icons';
import { PALETTES, type PaletteName } from './palette';

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

const iconEditorStore = defineStore<IconEditorState>(() => ({
  ...DEFAULT_ICON_EDITOR_STATE,
}));

/** Live, readonly view of the icon under construction. */
export const iconEditor = createStore(iconEditorStore);

/** Inspector tab in the right rail. */
export type InspectorTab = 'icon' | 'style' | 'export';

interface InspectorState {
  /** Currently visible inspector panel. */
  tab: InspectorTab;
}

const inspectorStore = defineStore<InspectorState>(() => ({ tab: 'icon' }));

/** Live, readonly view of the inspector tab selection. */
export const inspector = createStore(inspectorStore);

/**
 * Tracks every async icon resolution. Components show a skeleton while
 * `pending > 0`; stale resolutions detect supersession by comparing
 * their captured `requestId` against the live value.
 */
interface LoadingState {
  /** Count of in-flight icon resolutions — counter (not boolean) so concurrent fetches stop pulsing only once *every* request settles. */
  pending: number;
  /** Bumped on every action that supersedes a pending icon resolution (start of resolve, user pick, reset). */
  requestId: number;
}

const loadingStore = defineStore<LoadingState>(() => ({
  pending: 0,
  requestId: 0,
}));

/** Live, readonly view of in-flight icon resolution lifecycle. */
export const loading = createStore(loadingStore);

/**
 * Apply a user-driven icon pick. Zeroes `pending` and bumps `requestId`
 * so any in-flight resolve discards itself instead of clobbering the
 * pick — and so the URL mirror sees a settled icon immediately,
 * without waiting for the stale fetch to land.
 */
export const setIconAction = defineAction(
  [iconEditorStore, loadingStore],
  (icon, load, value: IconRef | undefined) => {
    icon.icon = value;
    load.pending = 0;
    load.requestId += 1;
  },
);

export const setPaletteAction = defineAction(
  [iconEditorStore],
  (state, name: PaletteName) => {
    state.palette = name;
  },
);

export const setShapeAction = defineAction(
  [iconEditorStore],
  (state, value: IconEditorShape) => {
    state.shape = value;
  },
);

export const setPaddingAction = defineAction(
  [iconEditorStore],
  (state, value: number) => {
    state.padding = value;
  },
);

/** Restore the canonical defaults and supersede any pending resolution. */
export const resetAction = defineAction(
  [iconEditorStore, loadingStore],
  (icon, load) => {
    Object.assign(icon, DEFAULT_ICON_EDITOR_STATE);
    load.pending = 0;
    load.requestId += 1;
  },
);

export const setInspectorTabAction = defineAction(
  [inspectorStore],
  (state, tab: InspectorTab) => {
    state.tab = tab;
  },
);

/** Subset of {@link IconEditorState} style fields recognized by `hydrateStyleAction`. */
export interface IconEditorStyleHydration {
  /** Palette name from the curated set. */
  palette?: string;
  /** Shape mask. */
  shape?: string;
  /** Padding percent (`0`–`40`). */
  padding?: number;
}

const PALETTE_NAMES = new Set<string>(PALETTES.map((entry) => entry.name));

const isPaletteName = (value: string): value is PaletteName =>
  PALETTE_NAMES.has(value);

const isShape = (value: string): value is IconEditorShape =>
  (SHAPES as ReadonlyArray<string>).includes(value);

const clampPadding = (value: number): number =>
  Math.max(0, Math.min(40, Math.floor(value)));

/**
 * Resolve a hydrate input into a complete style snapshot. Missing or
 * unparseable fields fall back to {@link DEFAULT_ICON_EDITOR_STATE} —
 * the URL is the source of truth, so a clean `/icon-editor` link must
 * render the canonical defaults regardless of what the singleton store
 * was holding from a prior session.
 */
export const resolveStyleHydration = (
  input: IconEditorStyleHydration,
): Pick<IconEditorState, 'palette' | 'shape' | 'padding'> => {
  const palette =
    input.palette && isPaletteName(input.palette) ? input.palette : undefined;
  const shape = input.shape && isShape(input.shape) ? input.shape : undefined;
  const padding =
    input.padding !== undefined && Number.isFinite(input.padding)
      ? clampPadding(input.padding)
      : undefined;
  return {
    palette: palette ?? DEFAULT_ICON_EDITOR_STATE.palette,
    shape: shape ?? DEFAULT_ICON_EDITOR_STATE.shape,
    padding: padding ?? DEFAULT_ICON_EDITOR_STATE.padding,
  };
};

/**
 * Apply validated style fields from a hydrate input. The icon is
 * resolved separately through {@link resolveIconEffect} — it requires
 * an async pack fetch and would race the URL-mirror effect if folded
 * into the same write.
 */
export const hydrateStyleAction = defineAction(
  [iconEditorStore],
  (state, input: IconEditorStyleHydration) => {
    const resolved = resolveStyleHydration(input);
    state.palette = resolved.palette;
    state.shape = resolved.shape;
    state.padding = resolved.padding;
  },
);

interface RandomStyleSeed {
  palette: PaletteName;
  shape: IconEditorShape;
  padding: number;
}

/** Padding presets `randomizeStyleEffect` chooses from — 10% steps across the slider. */
const PADDING_STEPS = [0, 10, 20, 30, 40] as const;

const pickFrom = <T>(arr: ReadonlyArray<T>): T =>
  arr[Math.floor(Math.random() * arr.length)];

const pickRandomStyle = (): RandomStyleSeed => ({
  palette: pickFrom(PALETTES).name,
  shape: pickFrom(SHAPES),
  padding: pickFrom(PADDING_STEPS),
});

const applyRandomStyleAction = defineAction(
  [iconEditorStore],
  (state, seed: RandomStyleSeed) => {
    state.palette = seed.palette;
    state.shape = seed.shape;
    state.padding = seed.padding;
  },
);

/**
 * Roll a fresh palette/shape/padding. The icon is randomized
 * separately ({@link randomizeIconEffect}) — async fetches and sync
 * style updates don't share a transactional boundary.
 */
export const randomizeStyleEffect = defineEffect([], pickRandomStyle, {
  onSuccess: applyRandomStyleAction,
});

const pickRandomIcon = async (): Promise<IconRef | undefined> => {
  const packs = await loadIconPackIndex();
  if (packs.length === 0) return undefined;
  const pack = packs[Math.floor(Math.random() * packs.length)];
  const manifest = await loadIconPackManifest(pack);
  if (manifest.pages.length === 0) return undefined;
  const pageIndex = Math.floor(Math.random() * manifest.pages.length);
  const page = await loadIconPage(pack.id, manifest.pages[pageIndex]);
  if (page.length === 0) return undefined;
  const entry = page[Math.floor(Math.random() * page.length)];
  return toIconRef(
    {
      id: manifest.id,
      width: manifest.width,
      height: manifest.height,
      license: pack.license,
      author: pack.author,
    },
    entry,
  );
};

/** Payload returned by every async icon resolution. */
interface ResolvedIcon {
  /** The resolved icon, or `undefined` when the pack/name didn't match. */
  icon: IconRef | undefined;
  /** Request id captured at start. Discarded when the live id has moved on. */
  requestId: number;
}

/** Bumps both pending and request id before kicking off any icon resolve. */
const beginIconResolveAction = defineAction([loadingStore], (state) => {
  state.pending += 1;
  state.requestId += 1;
});

/**
 * Decrements the loading counter and commits the resolved icon — but
 * only when the request id captured at start still matches the live
 * value. Stale resolutions still decrement the counter so the loading
 * indicator unwinds, but the icon write is dropped so a user pick (or
 * newer URL navigation) survives an in-flight fetch.
 */
const applyResolvedIconAction = defineAction(
  [iconEditorStore, loadingStore],
  (icon, load, payload: ResolvedIcon) => {
    load.pending = Math.max(0, load.pending - 1);
    if (load.requestId === payload.requestId && payload.icon) {
      icon.icon = payload.icon;
    }
  },
);

/** Decrements the loading counter when a resolve throws. */
const failIconResolveAction = defineAction([loadingStore], (state) => {
  state.pending = Math.max(0, state.pending - 1);
});

const randomIconCapability = async (
  load: DeepReadonly<LoadingState>,
): Promise<ResolvedIcon> => {
  const requestId = load.requestId;
  const icon = await pickRandomIcon();
  return { icon, requestId };
};

/** Roll a random icon and commit when the fetch lands, latest-wins. */
export const randomizeIconEffect = defineEffect(
  [loadingStore],
  randomIconCapability,
  {
    onStart: beginIconResolveAction,
    onSuccess: applyResolvedIconAction,
    onFailure: failIconResolveAction,
  },
);

/** Input for {@link resolveIconEffect} — a parsed `pack:name` reference. */
export interface ResolveIconInput {
  pack: string;
  name: string;
}

const resolveIconCapability = async (
  load: DeepReadonly<LoadingState>,
  input: ResolveIconInput,
): Promise<ResolvedIcon> => {
  const requestId = load.requestId;
  const icon = await resolveIconRef(input.pack, input.name);
  return { icon, requestId };
};

/** Resolve a fully-qualified icon ref and commit when the fetch lands, latest-wins. */
export const resolveIconEffect = defineEffect(
  [loadingStore],
  resolveIconCapability,
  {
    onStart: beginIconResolveAction,
    onSuccess: applyResolvedIconAction,
    onFailure: failIconResolveAction,
  },
);
