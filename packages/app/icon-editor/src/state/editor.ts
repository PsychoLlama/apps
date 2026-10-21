import { defineCell, defineCommand, defineStore } from '@lib/state/next';
import type { IconEntry, IconRef } from '../icons';
import { encodeIconRef } from '../icons';
import type { PaletteName } from '../palette';
import {
  $iconEntries,
  $picker,
  DEFAULT_PACK_ID,
  adoptIcon,
  openPack,
  type PickerState,
  type PickerView,
} from './picker';

/** Available shape masks for the icon canvas. */
export type IconEditorShape = 'square' | 'rounded' | 'squircle' | 'circle';

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

/** The style fields alone — everything a URL can hydrate synchronously. */
export type IconEditorStyle = Pick<
  IconEditorState,
  'palette' | 'shape' | 'padding'
>;

/** Canonical defaults the editor starts at and a reset returns to. */
export const DEFAULT_ICON_EDITOR_STATE: IconEditorState = {
  icon: undefined,
  palette: 'blue',
  shape: 'rounded',
  padding: 10,
};

/**
 * The icon under construction. Held by the editor screen — nothing here
 * outlives it, so a fresh visit always starts from the URL rather than
 * from whatever a prior session left behind.
 */
export const $editor = defineStore<IconEditorState>(() => ({
  ...DEFAULT_ICON_EDITOR_STATE,
}));

/**
 * Which surface the editing rail is showing. `properties` is the
 * always-on inspector (selected icon + style + export); `picker` is
 * the full-rail icon browser reached via the Browse button and left
 * when an icon is chosen.
 */
export type RailView = 'properties' | 'picker';

/** The editing rail's visible surface. */
export const $rail = defineCell<RailView>(() => 'properties');

/**
 * Tracks every async icon resolution. Components show a skeleton while
 * `pending > 0`; a resolution detects its own supersession by comparing
 * the `requestId` it captured at start against the live value.
 */
export interface LoadingState {
  /**
   * Count of in-flight icon resolutions — a counter (not a boolean) so
   * concurrent fetches stop pulsing only once *every* request settles.
   */
  pending: number;

  /**
   * Bumped on every event that supersedes a pending icon resolution
   * (start of resolve, user pick, reset).
   */
  requestId: number;
}

/** In-flight icon resolutions. */
export const $loading = defineStore<LoadingState>(() => ({
  pending: 0,
  requestId: 0,
}));

/**
 * Write the chosen icon, or clear it with `undefined`. Zeroing `pending`
 * and bumping `requestId` makes any in-flight resolve discard itself
 * instead of clobbering the pick — and lets the URL mirror see a settled
 * icon immediately, without waiting for the stale fetch to land.
 */
const pickIcon = (
  editor: IconEditorState,
  load: LoadingState,
  picker: PickerState,
  entries: Map<string, IconEntry>,
  icon: IconRef | undefined,
): void => {
  editor.icon = icon;
  load.pending = 0;
  load.requestId += 1;
  if (icon) adoptIcon(picker, entries, icon);
};

// --- Style + icon writes ---

/**
 * The user chose an icon from the grid. Returns the rail to the
 * properties inspector, so the icon, its style, and export land back in
 * one view.
 */
export const $iconPicked = defineCommand(
  [$editor, $loading, $picker, $iconEntries, $rail],
  (editor, load, picker, [entries], [, setRail]) =>
    (icon: IconRef) => {
      pickIcon(editor, load, picker, entries(), icon);
      setRail('properties');
    },
);

/** A palette was picked from the curated set. */
export const $paletteChanged = defineCommand(
  [$editor],
  (editor) => (palette: PaletteName) => {
    editor.palette = palette;
  },
);

/** A different canvas mask was selected. */
export const $shapeChanged = defineCommand(
  [$editor],
  (editor) => (shape: IconEditorShape) => {
    editor.shape = shape;
  },
);

/** The padding slider moved. */
export const $paddingChanged = defineCommand(
  [$editor],
  (editor) => (padding: number) => {
    editor.padding = padding;
  },
);

/**
 * Everything returns to the canonical defaults, superseding any pending
 * resolution. The picker returns to the default pack so the panel's pack
 * card matches the blank slate.
 */
export const $editorReset = defineCommand(
  [$editor, $loading, $picker, $iconEntries],
  (editor, load, picker, [entries]) =>
    () => {
      Object.assign(editor, DEFAULT_ICON_EDITOR_STATE);
      load.pending = 0;
      load.requestId += 1;
      openPack(picker, entries(), DEFAULT_PACK_ID);
    },
);

/**
 * The URL changed: validated style fields, plus the raw `icon` param.
 * Style lands right away, so a shared link never flashes the defaults.
 * The icon needs a pack fetch, so it resolves separately — this only
 * clears it when the param is genuinely gone.
 */
export const $urlHydrated = defineCommand(
  [$editor, $loading, $picker, $iconEntries],
  (editor, load, picker, [entries]) =>
    (style: IconEditorStyle, icon: string | undefined) => {
      editor.palette = style.palette;
      editor.shape = style.shape;
      editor.padding = style.padding;

      // An absent `icon` param is ambiguous: the mirror omits the key
      // while a resolve is in flight, so a Randomize round-trip arrives
      // back here looking exactly like a deliberate clear. Only treat it
      // as one once nothing is pending.
      if (
        icon === undefined &&
        editor.icon !== undefined &&
        load.pending === 0
      ) {
        pickIcon(editor, load, picker, entries(), undefined);
      }
    },
);

/** The rail swapped to the icon browser, showing `view`. */
export const $pickerOpened = defineCommand(
  [$picker, $rail],
  (picker, [, setRail]) =>
    (view: PickerView) => {
      picker.view = view;
      setRail('picker');
    },
);

/** The rail returned to the always-on properties inspector. */
export const $pickerClosed = defineCommand(
  [$rail],
  ([, setRail]) =>
    () =>
      setRail('properties'),
);

/**
 * Commit to a pack from the picker's list. Switching packs strands the
 * current icon — it belonged to the old pack — so the icon clears in the
 * same commit that swaps the pack and closes the picker. Dropping the
 * old pack's manifest, bodies, and request ledger rides along.
 */
export const $packChosen = defineCommand(
  [$editor, $loading, $picker, $iconEntries, $rail],
  (editor, load, picker, [entries], [, setRail]) =>
    (packId: string) => {
      if (editor.icon && editor.icon.pack !== packId) {
        pickIcon(editor, load, picker, entries(), undefined);
      }

      openPack(picker, entries(), packId);
      setRail('properties');
    },
);

// --- Async icon resolution lifecycle ---

/** An icon resolution began. Supersedes whatever was already in flight. */
export const $iconResolveStarted = defineCommand([$loading], (load) => () => {
  load.pending += 1;
  load.requestId += 1;
});

/**
 * The resolution started under `requestId` landed. Latest wins: anything
 * that superseded it since — a user pick, a reset, a newer resolve —
 * bumped the live id, and the stale icon is dropped rather than
 * clobbering the newer one. `undefined` means the reference no longer
 * exists, usually a stale shared link, and leaves the icon untouched.
 * Either way the loading counter unwinds.
 */
export const $iconResolved = defineCommand(
  [$editor, $loading, $picker, $iconEntries],
  (editor, load, picker, [entries]) =>
    (requestId: number, icon: IconRef | undefined) => {
      load.pending = Math.max(0, load.pending - 1);
      if (load.requestId !== requestId || !icon) return;

      editor.icon = icon;
      adoptIcon(picker, entries(), icon);
    },
);

// --- Derived ---

/**
 * The editor state as shareable search params. `null` deletes a key —
 * values at their default stay out of the URL so a resting link is
 * clean. An omitted key preserves whatever the URL already holds, which
 * is how the `icon` param survives while a resolution is in flight.
 */
// A type alias, not an interface, so it fits the router's index signature.
export type ShareParams = {
  /** Encoded `pack:name`. Absent — not `null` — while a resolve is pending. */
  icon?: string | null;

  /** Palette name. */
  palette: string | null;

  /** Shape mask. */
  shape: string | null;

  /** Padding percent. */
  pad: string | null;
};

const orNull = (value: string): string | null => (value === '' ? null : value);

/** Search params mirroring the current editor state. */
export const shareParamsOf = (
  editor: IconEditorState,
  load: LoadingState,
): ShareParams => {
  const params: ShareParams = {
    palette:
      editor.palette === DEFAULT_ICON_EDITOR_STATE.palette
        ? null
        : editor.palette,
    shape:
      editor.shape === DEFAULT_ICON_EDITOR_STATE.shape ? null : editor.shape,
    pad:
      editor.padding === DEFAULT_ICON_EDITOR_STATE.padding
        ? null
        : String(editor.padding),
  };

  // A user pick zeroes `pending` immediately, so their choice mirrors
  // right away even if a stale fetch is still in flight.
  if (load.pending === 0) params.icon = orNull(encodeIconRef(editor.icon));

  return params;
};
