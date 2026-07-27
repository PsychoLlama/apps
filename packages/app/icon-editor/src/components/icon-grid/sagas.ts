import { call, commit, defineSaga, spawn } from '@lib/state-next';
import {
  fetchPackIndex,
  fetchPackManifest,
  fetchPageEntries,
} from '../../capabilities';
import type { IconPageRequest } from '../../icons';
import {
  manifestLoadedTopic,
  packsLoadedTopic,
  pageIngestedTopic,
  pickerScope,
  type MissingPackData,
} from './store';

/**
 * Fetch the pack catalog. Cheap to re-run — the fetcher holds the
 * resolved promise, so a second caller pays nothing.
 */
export const loadPackIndexSaga = defineSaga(pickerScope, async function* () {
  const packs = yield* call(fetchPackIndex);
  yield commit(packsLoadedTopic(packs));
});

const loadPageBodiesSaga = defineSaga(
  pickerScope,
  async function* (request: IconPageRequest) {
    try {
      const result = yield* call(fetchPageEntries, request);
      yield commit(pageIngestedTopic(result));
    } catch {
      // The fetcher already logged. Tiles keep their skeletons and the
      // next page or search change retries.
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
        const manifest = yield* call(fetchPackManifest, missing.manifest);
        yield commit(manifestLoadedTopic(manifest));
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
