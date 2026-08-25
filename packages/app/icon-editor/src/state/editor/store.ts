import {
  defineFold,
  defineFormula,
  defineScope,
  defineStore,
  defineTopic,
} from '@lib/state';
import { encodeIconRef, type IconRef } from '../../icons';
import type { PaletteName } from '../../palette';

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

/** Canonical defaults the store starts at and a reset returns to. */
export const DEFAULT_ICON_EDITOR_STATE: IconEditorState = {
  icon: undefined,
  palette: 'blue',
  shape: 'rounded',
  padding: 10,
};

/**
 * Owns the icon under construction, the editing rail, and the async
 * resolution lifecycle. Anchored by the editor screen — nothing here
 * outlives it, so a fresh visit always starts from the URL rather than
 * from whatever a prior session left behind.
 */
export const iconEditorScope = defineScope();

/** Live, readonly view of the icon under construction. */
export const iconEditorStore = defineStore<IconEditorState>(
  iconEditorScope,
  () => ({
    ...DEFAULT_ICON_EDITOR_STATE,
  }),
);

/**
 * Which surface the editing rail is showing. `properties` is the
 * always-on inspector (selected icon + style + export); `picker` is
 * the full-rail icon browser reached via the Browse button and left
 * when an icon is chosen.
 */
export type RailView = 'properties' | 'picker';

/** Editing-rail navigation state. */
export interface RailState {
  /** Currently visible rail surface. */
  view: RailView;
}

/** Live, readonly view of the editing-rail surface. */
export const railStore = defineStore<RailState>(iconEditorScope, () => ({
  view: 'properties',
}));

/**
 * Tracks every async icon resolution. Components show a skeleton while
 * `pending > 0`; a resolution detects its own supersession by comparing
 * the `requestId` it captured at start against the live value.
 */
export interface LoadingState {
  /** Count of in-flight icon resolutions — a counter (not a boolean) so concurrent fetches stop pulsing only once *every* request settles. */
  pending: number;
  /** Bumped on every event that supersedes a pending icon resolution (start of resolve, user pick, reset). */
  requestId: number;
}

/** Live, readonly view of in-flight icon resolution lifecycle. */
export const loadingStore = defineStore<LoadingState>(iconEditorScope, () => ({
  pending: 0,
  requestId: 0,
}));

// --- Style + icon writes ---

/**
 * The user chose an icon, or cleared it with `undefined`. Zeroing
 * `pending` and bumping `requestId` makes any in-flight resolve discard
 * itself instead of clobbering the pick — and lets the URL mirror see a
 * settled icon immediately, without waiting for the stale fetch to land.
 *
 * Exported: the icon picker folds it to keep the active pack and its
 * body cache in step with the selection.
 */
export const iconPickedTopic = defineTopic<IconRef | undefined>();
defineFold(
  iconPickedTopic,
  [iconEditorStore, loadingStore],
  (editor, load, icon) => {
    editor.icon = icon;
    load.pending = 0;
    load.requestId += 1;
  },
);

/** A palette was picked from the curated set. */
export const paletteChangedTopic = defineTopic<PaletteName>();
defineFold(paletteChangedTopic, [iconEditorStore], (editor, palette) => {
  editor.palette = palette;
});

/** A different canvas mask was selected. */
export const shapeChangedTopic = defineTopic<IconEditorShape>();
defineFold(shapeChangedTopic, [iconEditorStore], (editor, shape) => {
  editor.shape = shape;
});

/** The padding slider moved. */
export const paddingChangedTopic = defineTopic<number>();
defineFold(paddingChangedTopic, [iconEditorStore], (editor, padding) => {
  editor.padding = padding;
});

/**
 * Everything returns to the canonical defaults, superseding any pending
 * resolution. Exported: the picker folds it back to the default pack so
 * the panel's pack card matches the blank slate.
 */
export const editorResetTopic = defineTopic();
defineFold(
  editorResetTopic,
  [iconEditorStore, loadingStore],
  (editor, load) => {
    Object.assign(editor, DEFAULT_ICON_EDITOR_STATE);
    load.pending = 0;
    load.requestId += 1;
  },
);

/**
 * Validated style fields arrived from the URL. The icon travels
 * separately — it needs an async pack fetch, so it lands through the
 * resolution lifecycle below.
 */
export const styleHydratedTopic = defineTopic<IconEditorStyle>();
defineFold(styleHydratedTopic, [iconEditorStore], (editor, style) => {
  editor.palette = style.palette;
  editor.shape = style.shape;
  editor.padding = style.padding;
});

/** The rail swapped to the full-rail icon browser. */
export const pickerOpenedTopic = defineTopic();
defineFold(pickerOpenedTopic, [railStore], (state) => {
  state.view = 'picker';
});

/** The rail returned to the always-on properties inspector. */
export const pickerClosedTopic = defineTopic();
defineFold(pickerClosedTopic, [railStore], (state) => {
  state.view = 'properties';
});

// --- Async icon resolution lifecycle ---

/** An icon resolution began. Supersedes whatever was already in flight. */
export const iconResolveStartedTopic = defineTopic();
defineFold(iconResolveStartedTopic, [loadingStore], (load) => {
  load.pending += 1;
  load.requestId += 1;
});

/**
 * A resolution won its race and landed. `undefined` means the reference
 * no longer exists — usually a stale shared link — and leaves the
 * current icon untouched.
 *
 * Exported: the picker folds it so a deep link or a shuffle pulls the
 * active pack along with the icon it resolved.
 */
export const iconResolvedTopic = defineTopic<IconRef | undefined>();
defineFold(
  iconResolvedTopic,
  [iconEditorStore, loadingStore],
  (editor, load, icon) => {
    load.pending = Math.max(0, load.pending - 1);
    if (icon) editor.icon = icon;
  },
);

/**
 * A resolution came back after something newer took its place. The
 * loading counter still unwinds; the icon write is dropped so a user
 * pick (or newer URL navigation) survives an in-flight fetch.
 */
export const iconResolveSupersededTopic = defineTopic();
defineFold(iconResolveSupersededTopic, [loadingStore], (load) => {
  load.pending = Math.max(0, load.pending - 1);
});

/** A resolution threw. */
export const iconResolveFailedTopic = defineTopic();
defineFold(iconResolveFailedTopic, [loadingStore], (load) => {
  load.pending = Math.max(0, load.pending - 1);
});

// --- Derived ---

/**
 * The editor state as shareable search params. `null` deletes a key —
 * values at their default stay out of the URL so a resting link is
 * clean. An omitted key preserves whatever the URL already holds, which
 * is how the `icon` param survives while a resolution is in flight.
 */
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
export const shareParamsFormula = defineFormula(
  [iconEditorStore, loadingStore],
  (editor, load): ShareParams => {
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
  },
);
