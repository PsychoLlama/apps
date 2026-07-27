import { simulate } from '@lib/state-next';
import {
  fetchPackIndex,
  fetchPackManifest,
  fetchPageEntries,
  rollIndex,
} from '../capabilities';
import {
  entryKey,
  iconEntriesCell,
  manifestLoadedTopic,
  packAssetsRequestedTopic,
  packSelectedTopic,
  packsLoadedTopic,
  pageIngestedTopic,
  pickerStore,
} from '../components/icon-grid/store';
import {
  hydrateFromUrlSaga,
  randomizeIconSaga,
  resolveIconSaga,
  selectPackSaga,
} from '../sagas';
import {
  DEFAULT_ICON_EDITOR_STATE,
  iconEditorStore,
  iconPickedTopic,
  iconResolveFailedTopic,
  iconResolveStartedTopic,
  iconResolveSupersededTopic,
  iconResolvedTopic,
  loadingStore,
  pickerClosedTopic,
  styleHydratedTopic,
} from '../store';
import type {
  IconEntry,
  IconPackManifest,
  IconPackSummary,
  IconRef,
} from '../icons';

const MANIFEST_URL = '/packs/mdi.json';
const PAGE_URL = '/packs/mdi/0.json';

const samplePack: IconPackSummary = {
  id: 'mdi',
  name: 'Material Design Icons',
  total: 2,
  width: 24,
  height: 24,
  samples: [],
  manifestUrl: MANIFEST_URL,
};

const sampleManifest: IconPackManifest = {
  id: 'mdi',
  name: 'Material Design Icons',
  width: 24,
  height: 24,
  total: 2,
  names: ['cog', 'home'],
  pages: [PAGE_URL],
  pageStart: [0],
};

const homeEntry: IconEntry = { name: 'home', body: '<path d="M0 0"/>' };
const cogEntry: IconEntry = { name: 'cog', body: '<path d="M1 1"/>' };

const sampleIcon: IconRef = {
  pack: 'mdi',
  name: 'home',
  body: homeEntry.body,
  width: 24,
  height: 24,
};

const cogIcon: IconRef = {
  pack: 'mdi',
  name: 'cog',
  body: cogEntry.body,
  width: 24,
  height: 24,
};

/** Bodies the picker has already ingested. */
const entries = new Map<string, IconEntry>([
  [entryKey('mdi', 'home'), homeEntry],
  [entryKey('mdi', 'cog'), cogEntry],
]);

/** Picker state with the catalog, manifest, and chunk already in hand. */
const warmPicker = {
  activePackId: 'mdi',
  packs: [samplePack],
  manifests: { mdi: sampleManifest },
  requested: { mdi: [MANIFEST_URL, PAGE_URL] },
};

/** Picker state holding nothing — every lookup pays for its assets. */
const coldPicker = {
  activePackId: 'mdi',
  packs: undefined,
  manifests: {},
  requested: {},
};

/** Topic of each fact in a trace's commit, in order. */
const topicsOf = (commits: ReadonlyArray<ReadonlyArray<unknown>>) =>
  commits.map((facts) => facts.map((fact) => (fact as readonly unknown[])[0]));

const editorState = (icon: IconRef | undefined) => ({
  ...DEFAULT_ICON_EDITOR_STATE,
  icon,
});

describe('resolveIconSaga', () => {
  it('brackets the lookup with a start and a landing, both as single transitions', async () => {
    const trace = await simulate(
      resolveIconSaga({ pack: 'mdi', name: 'home' }),
      {
        reads: [
          [pickerStore, warmPicker],
          [iconEntriesCell, entries],
          [loadingStore, { pending: 1, requestId: 1 }],
        ],
      },
    );

    expect(topicsOf(trace.commits)).toEqual([
      [iconResolveStartedTopic],
      [iconResolvedTopic],
    ]);
    expect(trace.commits[1][0][1]).toEqual(sampleIcon);
  });

  it('pulls the catalog, manifest, and owning chunk into state on a cold lookup', async () => {
    const trace = await simulate(
      resolveIconSaga({ pack: 'mdi', name: 'home' }),
      {
        calls: [
          [fetchPackIndex, () => [samplePack]],
          [fetchPackManifest, () => sampleManifest],
          [
            fetchPageEntries,
            () => ({ packId: 'mdi', pageUrl: PAGE_URL, entries: [homeEntry] }),
          ],
        ],
        reads: [
          [pickerStore, coldPicker],
          [iconEntriesCell, entries],
          [loadingStore, { pending: 1, requestId: 1 }],
        ],
      },
    );

    // Every asset the resolve touches lands in state on the way past, so
    // the grid inherits the chunk instead of re-fetching it.
    expect(topicsOf(trace.commits)).toEqual([
      [iconResolveStartedTopic],
      [packsLoadedTopic],
      [packAssetsRequestedTopic],
      [manifestLoadedTopic],
      [packAssetsRequestedTopic],
      [pageIngestedTopic],
      [iconResolvedTopic],
    ]);
  });

  it('lands an empty resolution when the pack no longer exists', async () => {
    const trace = await simulate(
      resolveIconSaga({ pack: 'gone', name: 'home' }),
      {
        reads: [
          [pickerStore, warmPicker],
          [iconEntriesCell, entries],
          [loadingStore, { pending: 1, requestId: 1 }],
        ],
      },
    );

    expect(topicsOf(trace.commits)).toEqual([
      [iconResolveStartedTopic],
      [iconResolvedTopic],
    ]);
    expect(trace.commits[1][0][1]).toBeUndefined();
  });

  it('lands an empty resolution when the name is absent from the manifest', async () => {
    const trace = await simulate(
      resolveIconSaga({ pack: 'mdi', name: 'nonexistent' }),
      {
        reads: [
          [pickerStore, warmPicker],
          [iconEntriesCell, entries],
          [loadingStore, { pending: 1, requestId: 1 }],
        ],
      },
    );

    expect(trace.commits[1][0][1]).toBeUndefined();
  });

  it('discards the result when a newer request took its place', async () => {
    let requestId = 1;
    const trace = await simulate(
      resolveIconSaga({ pack: 'mdi', name: 'home' }),
      {
        calls: [
          [
            fetchPackManifest,
            () => {
              // A user pick landed while the fetch was in flight.
              requestId = 9;
              return sampleManifest;
            },
          ],
        ],
        reads: [
          [pickerStore, { ...warmPicker, manifests: {} }],
          [iconEntriesCell, entries],
          // `read` is stubbed by ref, so both reads see the live value.
          [
            loadingStore,
            {
              get pending() {
                return 1;
              },
              get requestId() {
                return requestId;
              },
            },
          ],
        ],
      },
    );

    expect(topicsOf(trace.commits)).toEqual([
      [iconResolveStartedTopic],
      [packAssetsRequestedTopic],
      [manifestLoadedTopic],
      [iconResolveSupersededTopic],
    ]);
  });

  it('commits a failure fact when a fetch throws', async () => {
    const trace = await simulate(
      resolveIconSaga({ pack: 'mdi', name: 'home' }),
      {
        calls: [
          [
            fetchPackIndex,
            () => {
              throw new Error('offline');
            },
          ],
        ],
        reads: [
          [pickerStore, coldPicker],
          [iconEntriesCell, entries],
          [loadingStore, { pending: 1, requestId: 1 }],
        ],
      },
    );

    expect(topicsOf(trace.commits)).toEqual([
      [iconResolveStartedTopic],
      [iconResolveFailedTopic],
    ]);
  });
});

describe('randomizeIconSaga', () => {
  it('rolls a chunk and then a name within the active pack', async () => {
    const rolls: number[] = [];
    const trace = await simulate(randomizeIconSaga(), {
      calls: [
        [
          rollIndex,
          (_signal: AbortSignal, count: number) => {
            rolls.push(count);
            return 0;
          },
        ],
      ],
      reads: [
        [pickerStore, warmPicker],
        [iconEntriesCell, entries],
        [loadingStore, { pending: 1, requestId: 1 }],
      ],
    });

    // One roll over the chunk list, one over that chunk's names — never
    // over the whole pack, which is what keeps it off the full name list.
    expect(rolls).toEqual([1, 2]);
    expect(topicsOf(trace.commits)).toEqual([
      [iconResolveStartedTopic],
      [iconResolvedTopic],
    ]);
    expect(trace.commits[1][0][1]).toEqual(cogIcon);
  });
});

describe('hydrateFromUrlSaga', () => {
  it('lands validated style fields as one transition when the URL carries no icon', async () => {
    const trace = await simulate(hydrateFromUrlSaga({ palette: 'mint' }), {
      reads: [
        [iconEditorStore, editorState(undefined)],
        [pickerStore, warmPicker],
        [loadingStore, { pending: 0, requestId: 0 }],
      ],
    });

    expect(topicsOf(trace.commits)).toEqual([[styleHydratedTopic]]);
    expect(trace.commits[0][0][1]).toEqual({
      palette: 'mint',
      shape: DEFAULT_ICON_EDITOR_STATE.shape,
      padding: DEFAULT_ICON_EDITOR_STATE.padding,
    });
  });

  it('clears the icon in the same transition when the param is genuinely gone', async () => {
    const trace = await simulate(hydrateFromUrlSaga({}), {
      reads: [
        [iconEditorStore, editorState(sampleIcon)],
        [pickerStore, warmPicker],
        [loadingStore, { pending: 0, requestId: 0 }],
      ],
    });

    expect(topicsOf(trace.commits)).toEqual([
      [styleHydratedTopic, iconPickedTopic],
    ]);
  });

  it('leaves the icon alone when the absent param is a mirror echo of a pending resolve', async () => {
    const trace = await simulate(hydrateFromUrlSaga({}), {
      reads: [
        [iconEditorStore, editorState(sampleIcon)],
        [pickerStore, warmPicker],
        [loadingStore, { pending: 1, requestId: 1 }],
      ],
    });

    expect(topicsOf(trace.commits)).toEqual([[styleHydratedTopic]]);
  });

  it('skips the lookup when the param already matches the icon we hold', async () => {
    const trace = await simulate(hydrateFromUrlSaga({ icon: 'mdi:home' }), {
      reads: [
        [iconEditorStore, editorState(sampleIcon)],
        [pickerStore, warmPicker],
      ],
    });

    expect(topicsOf(trace.commits)).toEqual([[styleHydratedTopic]]);
  });

  it('resolves a new reference through the resolution lifecycle', async () => {
    const trace = await simulate(hydrateFromUrlSaga({ icon: 'mdi:cog' }), {
      reads: [
        [iconEditorStore, editorState(sampleIcon)],
        [pickerStore, warmPicker],
        [iconEntriesCell, entries],
        [loadingStore, { pending: 1, requestId: 1 }],
      ],
    });

    expect(topicsOf(trace.commits)).toEqual([
      [styleHydratedTopic],
      [iconResolveStartedTopic],
      [iconResolvedTopic],
    ]);
    expect(trace.commits[2][0][1]).toEqual(cogIcon);
  });

  it('ignores an unparseable reference rather than clearing the icon', async () => {
    const trace = await simulate(hydrateFromUrlSaga({ icon: ':broken' }), {
      reads: [
        [iconEditorStore, editorState(sampleIcon)],
        [pickerStore, warmPicker],
        [loadingStore, { pending: 0, requestId: 0 }],
      ],
    });

    expect(topicsOf(trace.commits)).toEqual([[styleHydratedTopic]]);
  });
});

describe('selectPackSaga', () => {
  it('swaps the pack, closes the picker, and strands the old icon — one transition', async () => {
    const trace = await simulate(selectPackSaga('tabler'), {
      reads: [[iconEditorStore, editorState(sampleIcon)]],
    });

    expect(topicsOf(trace.commits)).toEqual([
      [packSelectedTopic, pickerClosedTopic, iconPickedTopic],
    ]);
  });

  it('keeps the icon when the chosen pack is the one it already belongs to', async () => {
    const trace = await simulate(selectPackSaga('mdi'), {
      reads: [[iconEditorStore, editorState(sampleIcon)]],
    });

    expect(topicsOf(trace.commits)).toEqual([
      [packSelectedTopic, pickerClosedTopic],
    ]);
  });
});
