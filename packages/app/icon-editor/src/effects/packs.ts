/// <reference types="@dev/vite-plugin-icon-packs/types" />

import { assert } from '@lib/assert';
import { collect } from '@lib/effects';
import indexUrl from 'virtual:icon-packs';
import type {
  IconEntry,
  IconIndexPayload,
  IconPackManifest,
  IconPackSummary,
  IconPageRequest,
} from '../icons';
import {
  $manifestLoaded,
  $packAssetsRequested,
  $packsLoaded,
  $pageIngested,
  $picker,
  type MissingPackData,
} from '../state';

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);

  // Every asset is emitted by the build, so a miss is a bug.
  assert(response.ok, `Failed to fetch ${url}: ${response.status}`);

  return (await response.json()) as T;
};

/**
 * The pack catalog, landed in `$picker`. Fetched once for as long as
 * anything holds it, so every lookup that needs it shares one request.
 */
export const $packIndex = collect([$packsLoaded], async (packsLoaded) => {
  const { packs } = await fetchJson<IconIndexPayload>(indexUrl);
  packsLoaded(packs);

  return packs;
});

/**
 * Load a pack's manifest — names plus chunk URLs — into `$picker`,
 * fetching only on a miss.
 */
export const $loadManifest = collect(
  [$picker, $packAssetsRequested, $manifestLoaded],
  (picker, packAssetsRequested, manifestLoaded) =>
    async (pack: IconPackSummary): Promise<IconPackManifest> => {
      const cached = picker.manifests[pack.id];
      if (cached) return cached;

      packAssetsRequested(pack.id, [pack.manifestUrl]);
      const manifest = await fetchJson<IconPackManifest>(pack.manifestUrl);
      manifestLoaded(manifest);

      return manifest;
    },
);

/**
 * Load one body chunk into `$iconEntries`, skipped if it has already been
 * asked for. Callers that want a specific icon read it back from there.
 */
export const $loadPage = collect(
  [$picker, $packAssetsRequested, $pageIngested],
  (picker, packAssetsRequested, pageIngested) =>
    async (request: IconPageRequest): Promise<void> => {
      if (picker.requested[request.packId]?.includes(request.pageUrl)) return;

      packAssetsRequested(request.packId, [request.pageUrl]);
      const entries = await fetchJson<IconEntry[]>(request.pageUrl);
      pageIngested({ ...request, entries });
    },
);

/**
 * Fill in whatever the picker's view is missing: the active pack's
 * manifest first, then the body chunks its visible tiles need. Chunks
 * load side by side, each landing as it arrives.
 */
export const $loadMissingPackData = collect(
  [$loadManifest, $loadPage],
  (loadManifest, loadPage) =>
    async (missing: MissingPackData): Promise<void> => {
      if (missing.manifest) {
        await loadManifest(missing.manifest);
        return;
      }

      await Promise.all(missing.pages.map(loadPage));
    },
);
