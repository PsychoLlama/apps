import { simulate } from '@lib/state-next';
import {
  fetchIconRef,
  pickRandomIcon,
  releasePackCaches,
} from '../capabilities';
import { packSelected, picker } from '../components/icon-grid/store';
import {
  hydrateFromUrl,
  randomizeIcon,
  resolveIcon,
  selectPack,
} from '../sagas';
import {
  DEFAULT_ICON_EDITOR_STATE,
  iconEditor,
  iconPicked,
  iconResolveFailed,
  iconResolveStarted,
  iconResolveSuperseded,
  iconResolved,
  loading,
  pickerClosed,
  styleHydrated,
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

describe('resolveIcon', () => {
  it('brackets the fetch with a start and a landing, both as single transitions', async () => {
    const trace = await simulate(resolveIcon({ pack: 'mdi', name: 'home' }), {
      calls: [[fetchIconRef, () => sampleIcon]],
      reads: [[loading, { pending: 1, requestId: 1 }]],
    });

    expect(topicsOf(trace.commits)).toEqual([
      [iconResolveStarted],
      [iconResolved],
    ]);
    expect(trace.commits[1][0][1]).toEqual(sampleIcon);
  });

  it('discards the result when a newer request took its place', async () => {
    let requestId = 1;
    const trace = await simulate(resolveIcon({ pack: 'mdi', name: 'home' }), {
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
          loading,
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
    });

    expect(topicsOf(trace.commits)).toEqual([
      [iconResolveStarted],
      [iconResolveSuperseded],
    ]);
  });

  it('commits a failure fact when the fetch throws', async () => {
    const trace = await simulate(resolveIcon({ pack: 'mdi', name: 'home' }), {
      calls: [
        [
          fetchIconRef,
          () => {
            throw new Error('offline');
          },
        ],
      ],
      reads: [[loading, { pending: 1, requestId: 1 }]],
    });

    expect(topicsOf(trace.commits)).toEqual([
      [iconResolveStarted],
      [iconResolveFailed],
    ]);
  });
});

describe('randomizeIcon', () => {
  it('rolls within the active pack', async () => {
    const seen: string[] = [];
    const trace = await simulate(randomizeIcon(), {
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
        [picker, { activePackId: 'tabler' }],
        [loading, { pending: 1, requestId: 1 }],
      ],
    });

    expect(seen).toEqual(['tabler']);
    expect(topicsOf(trace.commits)).toEqual([
      [iconResolveStarted],
      [iconResolved],
    ]);
  });
});

describe('hydrateFromUrl', () => {
  it('lands validated style fields as one transition when the URL carries no icon', async () => {
    const trace = await simulate(hydrateFromUrl({ palette: 'mint' }), {
      reads: [
        [iconEditor, editorState(undefined)],
        [loading, { pending: 0, requestId: 0 }],
      ],
    });

    expect(topicsOf(trace.commits)).toEqual([[styleHydrated]]);
    expect(trace.commits[0][0][1]).toEqual({
      palette: 'mint',
      shape: DEFAULT_ICON_EDITOR_STATE.shape,
      padding: DEFAULT_ICON_EDITOR_STATE.padding,
    });
  });

  it('clears the icon in the same transition when the param is genuinely gone', async () => {
    const trace = await simulate(hydrateFromUrl({}), {
      reads: [
        [iconEditor, editorState(sampleIcon)],
        [loading, { pending: 0, requestId: 0 }],
      ],
    });

    expect(topicsOf(trace.commits)).toEqual([[styleHydrated, iconPicked]]);
  });

  it('leaves the icon alone when the absent param is a mirror echo of a pending resolve', async () => {
    const trace = await simulate(hydrateFromUrl({}), {
      reads: [
        [iconEditor, editorState(sampleIcon)],
        [loading, { pending: 1, requestId: 1 }],
      ],
    });

    expect(topicsOf(trace.commits)).toEqual([[styleHydrated]]);
  });

  it('skips the fetch when the param already matches the icon we hold', async () => {
    const trace = await simulate(hydrateFromUrl({ icon: 'mdi:home' }), {
      reads: [[iconEditor, editorState(sampleIcon)]],
    });

    expect(topicsOf(trace.commits)).toEqual([[styleHydrated]]);
  });

  it('resolves a new reference through the resolution lifecycle', async () => {
    const trace = await simulate(hydrateFromUrl({ icon: 'tabler:rocket' }), {
      calls: [[fetchIconRef, () => sampleIcon]],
      reads: [
        [iconEditor, editorState(sampleIcon)],
        [loading, { pending: 1, requestId: 1 }],
      ],
    });

    expect(topicsOf(trace.commits)).toEqual([
      [styleHydrated],
      [iconResolveStarted],
      [iconResolved],
    ]);
  });

  it('ignores an unparseable reference rather than clearing the icon', async () => {
    const trace = await simulate(hydrateFromUrl({ icon: ':broken' }), {
      reads: [
        [iconEditor, editorState(sampleIcon)],
        [loading, { pending: 0, requestId: 0 }],
      ],
    });

    expect(topicsOf(trace.commits)).toEqual([[styleHydrated]]);
  });
});

describe('selectPack', () => {
  it('swaps the pack, closes the picker, and strands the old icon — one transition', async () => {
    const released: string[] = [];
    const trace = await simulate(selectPack('tabler'), {
      calls: [
        [
          releasePackCaches,
          (_signal: AbortSignal, packId: string) => released.push(packId),
        ],
      ],
      reads: [[iconEditor, editorState(sampleIcon)]],
    });

    expect(topicsOf(trace.commits)).toEqual([
      [packSelected, pickerClosed, iconPicked],
    ]);
    expect(released).toEqual(['tabler']);
  });

  it('keeps the icon when the chosen pack is the one it already belongs to', async () => {
    const trace = await simulate(selectPack('mdi'), {
      calls: [[releasePackCaches, () => undefined]],
      reads: [[iconEditor, editorState(sampleIcon)]],
    });

    expect(topicsOf(trace.commits)).toEqual([[packSelected, pickerClosed]]);
  });
});
