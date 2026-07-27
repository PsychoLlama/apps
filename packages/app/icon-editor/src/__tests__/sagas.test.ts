import { simulate } from '@lib/state-next';
import {
  fetchIconRef,
  pickRandomIcon,
  releasePackCaches,
} from '../capabilities';
import { packSelectedTopic, pickerStore } from '../components/icon-grid/store';
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
import type { IconRef } from '../icons';

const sampleIcon: IconRef = {
  pack: 'mdi',
  name: 'home',
  body: '<path d="M0 0"/>',
  width: 24,
  height: 24,
};

/** Topic of each fact in a trace's commit, in order. */
const topicsOf = (commits: ReadonlyArray<ReadonlyArray<unknown>>) =>
  commits.map((facts) => facts.map((fact) => (fact as readonly unknown[])[0]));

const editorState = (icon: IconRef | undefined) => ({
  ...DEFAULT_ICON_EDITOR_STATE,
  icon,
});

describe('resolveIconSaga', () => {
  it('brackets the fetch with a start and a landing, both as single transitions', async () => {
    const trace = await simulate(
      resolveIconSaga({ pack: 'mdi', name: 'home' }),
      {
        calls: [[fetchIconRef, () => sampleIcon]],
        reads: [[loadingStore, { pending: 1, requestId: 1 }]],
      },
    );

    expect(topicsOf(trace.commits)).toEqual([
      [iconResolveStartedTopic],
      [iconResolvedTopic],
    ]);
    expect(trace.commits[1][0][1]).toEqual(sampleIcon);
  });

  it('discards the result when a newer request took its place', async () => {
    let requestId = 1;
    const trace = await simulate(
      resolveIconSaga({ pack: 'mdi', name: 'home' }),
      {
        calls: [
          [
            fetchIconRef,
            () => {
              // A user pick landed while the fetch was in flight.
              requestId = 9;
              return sampleIcon;
            },
          ],
        ],
        // `read` is stubbed by ref, so both reads see the live value.
        reads: [
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
      [iconResolveSupersededTopic],
    ]);
  });

  it('commits a failure fact when the fetch throws', async () => {
    const trace = await simulate(
      resolveIconSaga({ pack: 'mdi', name: 'home' }),
      {
        calls: [
          [
            fetchIconRef,
            () => {
              throw new Error('offline');
            },
          ],
        ],
        reads: [[loadingStore, { pending: 1, requestId: 1 }]],
      },
    );

    expect(topicsOf(trace.commits)).toEqual([
      [iconResolveStartedTopic],
      [iconResolveFailedTopic],
    ]);
  });
});

describe('randomizeIconSaga', () => {
  it('rolls within the active pack', async () => {
    const seen: string[] = [];
    const trace = await simulate(randomizeIconSaga(), {
      calls: [
        [
          pickRandomIcon,
          (_signal: AbortSignal, packId: string) => {
            seen.push(packId);
            return sampleIcon;
          },
        ],
      ],
      reads: [
        [pickerStore, { activePackId: 'tabler' }],
        [loadingStore, { pending: 1, requestId: 1 }],
      ],
    });

    expect(seen).toEqual(['tabler']);
    expect(topicsOf(trace.commits)).toEqual([
      [iconResolveStartedTopic],
      [iconResolvedTopic],
    ]);
  });
});

describe('hydrateFromUrlSaga', () => {
  it('lands validated style fields as one transition when the URL carries no icon', async () => {
    const trace = await simulate(hydrateFromUrlSaga({ palette: 'mint' }), {
      reads: [
        [iconEditorStore, editorState(undefined)],
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
        [loadingStore, { pending: 1, requestId: 1 }],
      ],
    });

    expect(topicsOf(trace.commits)).toEqual([[styleHydratedTopic]]);
  });

  it('skips the fetch when the param already matches the icon we hold', async () => {
    const trace = await simulate(hydrateFromUrlSaga({ icon: 'mdi:home' }), {
      reads: [[iconEditorStore, editorState(sampleIcon)]],
    });

    expect(topicsOf(trace.commits)).toEqual([[styleHydratedTopic]]);
  });

  it('resolves a new reference through the resolution lifecycle', async () => {
    const trace = await simulate(
      hydrateFromUrlSaga({ icon: 'tabler:rocket' }),
      {
        calls: [[fetchIconRef, () => sampleIcon]],
        reads: [
          [iconEditorStore, editorState(sampleIcon)],
          [loadingStore, { pending: 1, requestId: 1 }],
        ],
      },
    );

    expect(topicsOf(trace.commits)).toEqual([
      [styleHydratedTopic],
      [iconResolveStartedTopic],
      [iconResolvedTopic],
    ]);
  });

  it('ignores an unparseable reference rather than clearing the icon', async () => {
    const trace = await simulate(hydrateFromUrlSaga({ icon: ':broken' }), {
      reads: [
        [iconEditorStore, editorState(sampleIcon)],
        [loadingStore, { pending: 0, requestId: 0 }],
      ],
    });

    expect(topicsOf(trace.commits)).toEqual([[styleHydratedTopic]]);
  });
});

describe('selectPackSaga', () => {
  it('swaps the pack, closes the picker, and strands the old icon — one transition', async () => {
    const released: string[] = [];
    const trace = await simulate(selectPackSaga('tabler'), {
      calls: [
        [
          releasePackCaches,
          (_signal: AbortSignal, packId: string) => released.push(packId),
        ],
      ],
      reads: [[iconEditorStore, editorState(sampleIcon)]],
    });

    expect(topicsOf(trace.commits)).toEqual([
      [packSelectedTopic, pickerClosedTopic, iconPickedTopic],
    ]);
    expect(released).toEqual(['tabler']);
  });

  it('keeps the icon when the chosen pack is the one it already belongs to', async () => {
    const trace = await simulate(selectPackSaga('mdi'), {
      calls: [[releasePackCaches, () => undefined]],
      reads: [[iconEditorStore, editorState(sampleIcon)]],
    });

    expect(topicsOf(trace.commits)).toEqual([
      [packSelectedTopic, pickerClosedTopic],
    ]);
  });
});
