import { call, commit, defineSaga, read, spawn } from '@lib/state-next';
import {
  fetchPackIndex,
  fetchPackManifest,
  fetchPageEntries,
} from '../../capabilities';
import type { IconPackSummary, IconPageRequest } from '../../icons';
import {
  manifestLoadedTopic,
  packAssetsRequestedTopic,
  packsLoadedTopic,
  pageIngestedTopic,
  pickerScope,
  pickerStore,
  type MissingPackData,
} from './store';

/**
 * The pack catalog, fetched only on a miss. State is the cache now, so
 * "ensure" is the whole contract — callers get the catalog and never
 * learn whether it cost a request.
 */
export const ensurePacksSaga = defineSaga(pickerScope, async function* () {
  const cached = (yield* read(pickerStore)).packs;
  if (cached) return cached;

  const packs = yield* call(fetchPackIndex);
  yield commit(packsLoadedTopic(packs));
  return packs;
});

/** A pack's manifest — names plus chunk URLs. Fetched only on a miss. */
export const ensureManifestSaga = defineSaga(
  pickerScope,
  async function* (pack: IconPackSummary) {
    const cached = (yield* read(pickerStore)).manifests[pack.id];
    if (cached) return cached;

    yield commit(
      packAssetsRequestedTopic({ packId: pack.id, urls: [pack.manifestUrl] }),
    );
    const manifest = yield* call(fetchPackManifest, pack);
    yield commit(manifestLoadedTopic(manifest));
    return manifest;
  },
);

/**
 * One body chunk, skipped if it has already been asked for. Returns
 * nothing — entries land in the cell, and callers that want a specific
 * icon read it back from there.
 */
export const ensurePageSaga = defineSaga(
  pickerScope,
  async function* (request: IconPageRequest) {
    const requested = (yield* read(pickerStore)).requested[request.packId];
    if (requested?.includes(request.pageUrl)) return;

    yield commit(
      packAssetsRequestedTopic({
        packId: request.packId,
        urls: [request.pageUrl],
      }),
    );
    const result = yield* call(fetchPageEntries, request);
    yield commit(pageIngestedTopic(result));
  },
);

const loadPageBodiesSaga = defineSaga(
  pickerScope,
  async function* (request: IconPageRequest) {
    try {
      yield* ensurePageSaga(request);
    } catch {
      // The fetcher already logged. Tiles keep their skeletons, and the
      // URL stays on the ledger — a failed chunk waits for the next pack
      // switch rather than re-firing every time the view moves.
    }
  },
);

/**
 * Fill in whatever the current view is missing: the active pack's
 * manifest first, then the body chunks its visible tiles need. Chunks
 * are spawned so a slow page doesn't hold up its siblings — each lands
 * its own transition as it arrives.
 */
export const loadMissingPackDataSaga = defineSaga(
  pickerScope,
  async function* (missing: MissingPackData) {
    if (missing.manifest) {
      try {
        yield* ensureManifestSaga(missing.manifest);
      } catch {
        // Already logged by the fetcher; the grid keeps its loading copy.
      }
      return;
    }

    for (const request of missing.pages) {
      yield* spawn(loadPageBodiesSaga(request));
    }
  },
);
