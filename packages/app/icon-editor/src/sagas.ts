import { call, commit, defineSaga, read } from '@lib/state-next';
import { createLogger } from '@lib/observability';
import {
  fetchIconRef,
  pickRandomIcon,
  releasePackCaches,
} from './capabilities';
import { packSelected, picker } from './components/icon-grid/store';
import {
  resolveStyleHydration,
  type IconEditorStyleHydration,
} from './hydration';
import { parseIconRef, type IconRef } from './icons';
import {
  iconEditor,
  iconEditorScope,
  iconPicked,
  iconResolveFailed,
  iconResolveStarted,
  iconResolveSuperseded,
  iconResolved,
  loading,
  pickerClosed,
  styleHydrated,
} from './store';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/**
 * Land a resolution, latest wins. `requestId` was snapshotted right
 * after the start commit; anything that supersedes a pending resolve —
 * a user pick, a reset, a newer resolve — bumps the live value, and the
 * stale result is discarded rather than clobbering the newer icon.
 */
const settleResolve = defineSaga(
  iconEditorScope,
  async function* (requestId: number, icon: IconRef | undefined) {
    if ((yield* read(loading)).requestId !== requestId) {
      yield commit(iconResolveSuperseded());
      return;
    }

    if (!icon) {
      // Usually a stale shared link pointing at a now-missing icon.
      logger.debug('Resolved an icon reference that no longer exists.');
    }

    yield commit(iconResolved(icon));
  },
);

/** Resolve a fully-qualified `pack:name` reference and commit when it lands. */
export const resolveIcon = defineSaga(
  iconEditorScope,
  async function* (ref: { pack: string; name: string }) {
    yield commit(iconResolveStarted());
    const requestId = (yield* read(loading)).requestId;

    try {
      const icon = yield* call(fetchIconRef, ref);
      yield* settleResolve(requestId, icon);
    } catch {
      yield commit(iconResolveFailed());
    }
  },
);

/**
 * Roll a fresh icon without leaving the active pack — style fields stay
 * put so the user keeps refining one look.
 */
export const randomizeIcon = defineSaga(iconEditorScope, async function* () {
  const packId = (yield* read(picker)).activePackId;
  yield commit(iconResolveStarted());
  const requestId = (yield* read(loading)).requestId;

  try {
    const icon = yield* call(pickRandomIcon, packId);
    yield* settleResolve(requestId, icon);
  } catch {
    yield commit(iconResolveFailed());
  }
});

/** Search params the editor hydrates from. */
export interface IconEditorUrlParams extends IconEditorStyleHydration {
  /** Encoded `pack:name` reference, when the URL carries one. */
  icon?: string;
}

/**
 * Apply a URL to the editor. Style fields land synchronously; the icon
 * needs a pack fetch, so it goes through the resolution lifecycle.
 */
export const hydrateFromUrl = defineSaga(
  iconEditorScope,
  async function* (params: IconEditorUrlParams) {
    const style = styleHydrated(resolveStyleHydration(params));
    const target = params.icon ? parseIconRef(params.icon) : undefined;

    if (!target) {
      const editor = yield* read(iconEditor);
      const load = yield* read(loading);
      // An absent `icon` param is ambiguous: the mirror omits the key
      // while a resolve is in flight, so a Randomize round-trip arrives
      // back here looking exactly like a deliberate clear. Only treat it
      // as one once nothing is pending.
      const clearing =
        params.icon === undefined &&
        editor.icon !== undefined &&
        load.pending === 0;

      if (clearing) {
        yield commit(style, iconPicked(undefined));
      } else {
        yield commit(style);
      }
      return;
    }

    yield commit(style);

    // The mirror echoes every icon write back as a navigation. Without
    // this the round-trip would spend a fetch — and a loading pulse — on
    // re-resolving the icon we already hold.
    const current = (yield* read(iconEditor)).icon;
    if (current?.pack === target.pack && current.name === target.name) return;

    yield* resolveIcon(target);
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
export const selectPack = defineSaga(
  iconEditorScope,
  async function* (packId: string) {
    const current = (yield* read(iconEditor)).icon;

    if (current && current.pack !== packId) {
      yield commit(packSelected(packId), pickerClosed(), iconPicked(undefined));
    } else {
      yield commit(packSelected(packId), pickerClosed());
    }

    yield* call(releasePackCaches, packId);
  },
);
