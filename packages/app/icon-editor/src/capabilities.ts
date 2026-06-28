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
import {
  DEFAULT_ICON_EDITOR_STATE,
  type IconEditorShape,
  type IconEditorState,
  type LoadingState,
} from './store';

/** Subset of {@link IconEditorState} style fields recognized by `hydrateStyle`. */
export interface IconEditorStyleHydration {
  /** Palette name from the curated set. */
  palette?: string;
  /** Shape mask. */
  shape?: string;
  /** Padding percent (`0`–`40`). */
  padding?: number;
}

const SHAPES: ReadonlyArray<IconEditorShape> = [
  'square',
  'rounded',
  'squircle',
  'circle',
];

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
 * Pull a random icon from a single pack: pick a page, pick an entry.
 * Scoped to `packId` so Randomize rolls a fresh glyph without leaving
 * the pack the user picked. Loads pages on demand — we never hold the
 * full pack in memory.
 */
export const pickRandomIcon = async (
  packId: string,
): Promise<IconRef | undefined> => {
  const packs = await loadIconPackIndex();
  const pack = packs.find((entry) => entry.id === packId);
  if (!pack) return undefined;
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
export interface ResolvedIcon {
  /** The resolved icon, or `undefined` when the pack/name didn't match. */
  icon: IconRef | undefined;
  /** Request id captured at start. Discarded when the live id has moved on. */
  requestId: number;
}

/** Input for the `resolveIconEffect` — a parsed `pack:name` reference. */
export interface ResolveIconInput {
  pack: string;
  name: string;
}

/**
 * Effect callback for `randomizeIconEffect`. Snapshots `requestId` so
 * the eventual `applyResolvedIcon` can detect supersession, then
 * delegates to {@link pickRandomIcon} scoped to the active pack.
 */
export const randomIconCapability = async (
  load: DeepReadonly<LoadingState>,
  packId: string,
): Promise<ResolvedIcon> => {
  const requestId = load.requestId;
  const icon = await pickRandomIcon(packId);
  return { icon, requestId };
};

/**
 * Effect callback for `resolveIconEffect`. Snapshots `requestId` then
 * resolves a fully-qualified icon ref through the pack fetcher.
 */
export const resolveIconCapability = async (
  load: DeepReadonly<LoadingState>,
  input: ResolveIconInput,
): Promise<ResolvedIcon> => {
  const requestId = load.requestId;
  const icon = await resolveIconRef(input.pack, input.name);
  return { icon, requestId };
};
