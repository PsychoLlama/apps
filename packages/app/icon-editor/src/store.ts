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

/** Inspector tab in the right rail. */
export type InspectorTab = 'icon' | 'style' | 'export';

/** Inspector tab selection state. */
export interface InspectorState {
  /** Currently visible inspector panel. */
  tab: InspectorTab;
}

export const inspectorStore = defineStore<InspectorState>(() => ({
  tab: 'icon',
}));

/** Live, readonly view of the inspector tab selection. */
export const inspector = createStore(inspectorStore);

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
