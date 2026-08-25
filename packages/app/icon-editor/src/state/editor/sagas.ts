import { call, commit, defineSaga, read } from '@lib/state';
import { createLogger } from '@lib/observability';
import { rollIndex } from '../capabilities';
import {
  ensureManifestSaga,
  ensurePacksSaga,
  ensurePageSaga,
} from '../picker/sagas';
import {
  entryKey,
  iconEntriesCell,
  packSelectedTopic,
  pickerStore,
} from '../picker/store';
import {
  resolveStyleHydration,
  type IconEditorStyleHydration,
} from '../../hydration';
import {
  findIconIndex,
  pageIndexFor,
  pageNameRange,
  parseIconRef,
  toIconRef,
  type IconPackManifest,
  type IconPackSummary,
  type IconRef,
} from '../../icons';
import {
  iconEditorStore,
  iconEditorScope,
  iconPickedTopic,
  iconResolveFailedTopic,
  iconResolveStartedTopic,
  iconResolveSupersededTopic,
  iconResolvedTopic,
  loadingStore,
  pickerClosedTopic,
  styleHydratedTopic,
} from './store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Land a resolution, latest wins. `requestId` was snapshotted right
 * after the start commit; anything that supersedes a pending resolve —
 * a user pick, a reset, a newer resolve — bumps the live value, and the
 * stale result is discarded rather than clobbering the newer icon.
 */
const settleResolveSaga = defineSaga(
  iconEditorScope,
  async function* (requestId: number, icon: IconRef | undefined) {
    if ((yield* read(loadingStore)).requestId !== requestId) {
      yield commit(iconResolveSupersededTopic());
      return;
    }

    if (!icon) {
      // Usually a stale shared link pointing at a now-missing icon.
      logger.debug('Resolved an icon reference that no longer exists.');
    }

    yield commit(iconResolvedTopic(icon));
  },
);

/**
 * Read a resolved icon back out of the picker's entry cache. Everything
 * the ref needs is already in state by this point — the manifest for
 * viewBox defaults, the catalog for attribution, the cell for the body.
 */
const buildIconRef = function* (
  pack: IconPackSummary,
  manifest: IconPackManifest,
  name: string,
) {
  const entry = (yield* read(iconEntriesCell)).get(entryKey(pack.id, name));
  if (!entry) return undefined;

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

/**
 * Walk a `pack:name` reference down to an icon, pulling in whatever the
 * lookup needs along the way. Every fetch lands in state first, so the
 * chunk this drags in also fills the grid tiles around it.
 */
const lookupIconSaga = defineSaga(
  iconEditorScope,
  async function* (ref: { pack: string; name: string }) {
    const packs = yield* ensurePacksSaga();
    const pack = packs.find((entry) => entry.id === ref.pack);
    if (!pack) return undefined;

    const manifest = yield* ensureManifestSaga(pack);
    const position = findIconIndex(manifest, ref.name);
    if (position < 0) return undefined;

    const pageUrl = manifest.pages[pageIndexFor(manifest, position)];
    yield* ensurePageSaga({ packId: pack.id, pageUrl });

    return yield* buildIconRef(pack, manifest, ref.name);
  },
);

/** Resolve a fully-qualified `pack:name` reference and commit when it lands. */
export const resolveIconSaga = defineSaga(
  iconEditorScope,
  async function* (ref: { pack: string; name: string }) {
    yield commit(iconResolveStartedTopic());
    const requestId = (yield* read(loadingStore)).requestId;

    try {
      const icon = yield* lookupIconSaga(ref);
      yield* settleResolveSaga(requestId, icon);
    } catch {
      yield commit(iconResolveFailedTopic());
    }
  },
);

/**
 * Pick an arbitrary icon from a pack: roll a chunk, pull it in, roll a
 * name inside it. Rolling the chunk first is what keeps Randomize from
 * needing the whole pack in memory — one chunk is enough, and it warms
 * the grid on the way through.
 */
const rollIconSaga = defineSaga(
  iconEditorScope,
  async function* (packId: string) {
    const packs = yield* ensurePacksSaga();
    const pack = packs.find((entry) => entry.id === packId);
    if (!pack) return undefined;

    const manifest = yield* ensureManifestSaga(pack);
    if (manifest.pages.length === 0) return undefined;

    const pageIndex = yield* call(rollIndex, manifest.pages.length);
    yield* ensurePageSaga({ packId, pageUrl: manifest.pages[pageIndex] });

    const [start, end] = pageNameRange(manifest, pageIndex);
    const names = manifest.names.slice(start, end);
    if (names.length === 0) return undefined;

    const nameIndex = yield* call(rollIndex, names.length);
    return yield* buildIconRef(pack, manifest, names[nameIndex]);
  },
);

/**
 * Roll a fresh icon without leaving the active pack — style fields stay
 * put so the user keeps refining one look.
 */
export const randomizeIconSaga = defineSaga(
  iconEditorScope,
  async function* () {
    const packId = (yield* read(pickerStore)).activePackId;
    yield commit(iconResolveStartedTopic());
    const requestId = (yield* read(loadingStore)).requestId;

    try {
      const icon = yield* rollIconSaga(packId);
      yield* settleResolveSaga(requestId, icon);
    } catch {
      yield commit(iconResolveFailedTopic());
    }
  },
);

/** Search params the editor hydrates from. */
export interface IconEditorUrlParams extends IconEditorStyleHydration {
  /** Encoded `pack:name` reference, when the URL carries one. */
  icon?: string;
}

/**
 * Apply a URL to the editor. Style fields land first and synchronously,
 * so a shared link never flashes the defaults; the icon needs a pack
 * fetch, so it goes through the resolution lifecycle.
 *
 * The catalog is ensured here rather than from a mount hook. Both would
 * want it on startup — the pack card always, a deep link additionally —
 * and with state as the cache there's no shared promise to collapse two
 * simultaneous misses into one request. Sequencing them behind a single
 * saga is what keeps the cold load down to one index fetch.
 */
export const hydrateFromUrlSaga = defineSaga(
  iconEditorScope,
  async function* (params: IconEditorUrlParams) {
    const style = styleHydratedTopic(resolveStyleHydration(params));
    const target = params.icon ? parseIconRef(params.icon) : undefined;

    if (!target) {
      const editor = yield* read(iconEditorStore);
      const load = yield* read(loadingStore);
      // An absent `icon` param is ambiguous: the mirror omits the key
      // while a resolve is in flight, so a Randomize round-trip arrives
      // back here looking exactly like a deliberate clear. Only treat it
      // as one once nothing is pending.
      const clearing =
        params.icon === undefined &&
        editor.icon !== undefined &&
        load.pending === 0;

      if (clearing) {
        yield commit(style, iconPickedTopic(undefined));
      } else {
        yield commit(style);
      }
    } else {
      yield commit(style);
    }

    // The properties panel's pack card reads from the catalog whether or
    // not the URL named an icon.
    yield* ensurePacksSaga();
    if (!target) return;

    // The mirror echoes every icon write back as a navigation. Without
    // this the round-trip would spend a fetch — and a loading pulse — on
    // re-resolving the icon we already hold.
    const current = (yield* read(iconEditorStore)).icon;
    if (current?.pack === target.pack && current.name === target.name) return;

    yield* resolveIconSaga(target);
  },
);

/**
 * Commit to a pack from the picker's list. Switching packs strands the
 * current icon — it belonged to the old pack — so the icon clears in the
 * same transition that swaps the pack and closes the picker.
 *
 * Dropping the old pack's manifest, bodies, and request ledger rides
 * along inside `packSelectedTopic`'s fold — there's one cache now, so
 * the switch is the whole eviction.
 */
export const selectPackSaga = defineSaga(
  iconEditorScope,
  async function* (packId: string) {
    const current = (yield* read(iconEditorStore)).icon;

    if (current && current.pack !== packId) {
      yield commit(
        packSelectedTopic(packId),
        pickerClosedTopic(),
        iconPickedTopic(undefined),
      );
    } else {
      yield commit(packSelectedTopic(packId), pickerClosedTopic());
    }
  },
);
