import { createStore, defineStore } from '@lib/state';
import type { IconRef } from './icons';
import type { PaletteName } from './palette';

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

/** Canonical defaults the store starts at and `reset` returns to. */
export const DEFAULT_ICON_EDITOR_STATE: IconEditorState = {
  icon: undefined,
  palette: 'blue',
  shape: 'rounded',
  padding: 10,
};

export const iconEditorStore = defineStore<IconEditorState>(() => ({
  ...DEFAULT_ICON_EDITOR_STATE,
}));

/** Live, readonly view of the icon under construction. */
export const iconEditor = createStore(iconEditorStore);

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

export const railStore = defineStore<RailState>(() => ({
  view: 'properties',
}));

/** Live, readonly view of the editing-rail surface. */
export const rail = createStore(railStore);

/**
 * Tracks every async icon resolution. Components show a skeleton while
 * `pending > 0`; stale resolutions detect supersession by comparing
 * their captured `requestId` against the live value.
 */
export interface LoadingState {
  /** Count of in-flight icon resolutions — counter (not boolean) so concurrent fetches stop pulsing only once *every* request settles. */
  pending: number;
  /** Bumped on every action that supersedes a pending icon resolution (start of resolve, user pick, reset). */
  requestId: number;
}

export const loadingStore = defineStore<LoadingState>(() => ({
  pending: 0,
  requestId: 0,
}));

/** Live, readonly view of in-flight icon resolution lifecycle. */
export const loading = createStore(loadingStore);
