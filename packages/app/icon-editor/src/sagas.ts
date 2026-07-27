import { call, commit, defineSaga, read } from '@lib/state-next';
import { createLogger } from '@lib/observability';
import {
  fetchIconRef,
  pickRandomIcon,
  releasePackCaches,
} from './capabilities';
import { packSelectedTopic, pickerStore } from './components/icon-grid/store';
import {
  resolveStyleHydration,
  type IconEditorStyleHydration,
} from './hydration';
import { parseIconRef, type IconRef } from './icons';
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

/** Resolve a fully-qualified `pack:name` reference and commit when it lands. */
export const resolveIconSaga = defineSaga(
  iconEditorScope,
  async function* (ref: { pack: string; name: string }) {
    yield commit(iconResolveStartedTopic());
    const requestId = (yield* read(loadingStore)).requestId;

    try {
      const icon = yield* call(fetchIconRef, ref);
      yield* settleResolveSaga(requestId, icon);
    } catch {
      yield commit(iconResolveFailedTopic());
    }
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
      const icon = yield* call(pickRandomIcon, packId);
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
 * Apply a URL to the editor. Style fields land synchronously; the icon
 * needs a pack fetch, so it goes through the resolution lifecycle.
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
      return;
    }

    yield commit(style);

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
 * The pack switch also drops the previous pack's cached manifest and
 * bodies, in the picker's state (through the fold) and in the fetcher's
 * module-level caches (here).
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

    yield* call(releasePackCaches, packId);
  },
);
