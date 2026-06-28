import { defineAction, defineEffect } from '@lib/state';
import { createLogger } from '@lib/observability';
import type { IconRef } from './icons';
import type { PaletteName } from './palette';
import {
  randomIconCapability,
  resolveIconCapability,
  resolveStyleHydration,
  type IconEditorStyleHydration,
  type ResolvedIcon,
} from './capabilities';
import {
  DEFAULT_ICON_EDITOR_STATE,
  iconEditorStore,
  loadingStore,
  railStore,
  type IconEditorShape,
} from './store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

// --- Style + icon writes ---

/**
 * Apply a user-driven icon pick. Zeroes `pending` and bumps `requestId`
 * so any in-flight resolve discards itself instead of clobbering the
 * pick — and so the URL mirror sees a settled icon immediately,
 * without waiting for the stale fetch to land.
 */
export const setIcon = defineAction(
  [iconEditorStore, loadingStore],
  (icon, load, value: IconRef | undefined) => {
    icon.icon = value;
    load.pending = 0;
    load.requestId += 1;
  },
);

export const setPalette = defineAction(
  [iconEditorStore],
  (state, name: PaletteName) => {
    state.palette = name;
  },
);

export const setShape = defineAction(
  [iconEditorStore],
  (state, value: IconEditorShape) => {
    state.shape = value;
  },
);

export const setPadding = defineAction(
  [iconEditorStore],
  (state, value: number) => {
    state.padding = value;
  },
);

/** Restore the canonical defaults and supersede any pending resolution. */
export const reset = defineAction(
  [iconEditorStore, loadingStore],
  (icon, load) => {
    Object.assign(icon, DEFAULT_ICON_EDITOR_STATE);
    load.pending = 0;
    load.requestId += 1;
  },
);

/**
 * Apply validated style fields from a hydrate input. The icon is
 * resolved separately through {@link resolveIconEffect} — it requires
 * an async pack fetch and would race the URL-mirror effect if folded
 * into the same write.
 */
export const hydrateStyle = defineAction(
  [iconEditorStore],
  (state, input: IconEditorStyleHydration) => {
    const resolved = resolveStyleHydration(input);
    state.palette = resolved.palette;
    state.shape = resolved.shape;
    state.padding = resolved.padding;
  },
);

/** Swap the rail to the full-rail icon browser. */
export const openPicker = defineAction([railStore], (state) => {
  state.view = 'picker';
});

/** Return the rail to the always-on properties inspector. */
export const closePicker = defineAction([railStore], (state) => {
  state.view = 'properties';
});

// --- Async icon resolution lifecycle ---

/** Bumps both pending and request id before kicking off any icon resolve. */
export const beginIconResolve = defineAction([loadingStore], (state) => {
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
export const applyResolvedIcon = defineAction(
  [iconEditorStore, loadingStore],
  (icon, load, payload: ResolvedIcon) => {
    load.pending = Math.max(0, load.pending - 1);
    if (load.requestId !== payload.requestId) return; // superseded; expected
    if (payload.icon) {
      icon.icon = payload.icon;
    } else {
      // Usually a stale shared link pointing at a now-missing icon.
      logger.debug('Resolved an icon reference that no longer exists.');
    }
  },
);

/** Decrements the loading counter when a resolve throws. */
export const failIconResolve = defineAction([loadingStore], (state) => {
  state.pending = Math.max(0, state.pending - 1);
});

/** Roll a random icon and commit when the fetch lands, latest-wins. */
export const randomizeIconEffect = defineEffect(
  [loadingStore],
  randomIconCapability,
  {
    onStart: beginIconResolve,
    onSuccess: applyResolvedIcon,
    onFailure: failIconResolve,
  },
);

/** Resolve a fully-qualified icon ref and commit when the fetch lands, latest-wins. */
export const resolveIconEffect = defineEffect(
  [loadingStore],
  resolveIconCapability,
  {
    onStart: beginIconResolve,
    onSuccess: applyResolvedIcon,
    onFailure: failIconResolve,
  },
);
