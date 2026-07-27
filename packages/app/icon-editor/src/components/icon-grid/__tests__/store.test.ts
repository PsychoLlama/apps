import { createTestRuntime } from '@lib/state-next';
import {
  entryKey,
  iconEntriesCell,
  manifestLoadedTopic,
  missingPackDataFormula,
  packAssetsRequestedTopic,
  packSearchChangedTopic,
  packSelectedTopic,
  packsLoadedTopic,
  pageChangedTopic,
  pageIngestedTopic,
  pageViewFormula,
  pickerScope,
  pickerStore,
  pickerViewChangedTopic,
  searchChangedTopic,
} from '../store';
import { iconEditorScope } from '../../../store';
import type {
  IconEntry,
  IconPackManifest,
  IconPackSummary,
  IconPageResult,
} from '../../../icons';

const entry = (name: string, body = '<path/>'): IconEntry => ({ name, body });

const manifest = (
  id: string,
  names: string[],
  overrides: Partial<IconPackManifest> = {},
): IconPackManifest => ({
  id,
  name: id,
  width: 24,
  height: 24,
  total: names.length,
  names,
  pages: [`/${id}/page-0.json`],
  pageStart: [0],
  ...overrides,
});

const pack = (id: string): IconPackSummary => ({
  id,
  name: id,
  total: 1,
  width: 24,
  height: 24,
  samples: [],
  manifestUrl: `/${id}/manifest.json`,
});

const pageResult = (packId: string, entries: IconEntry[]): IconPageResult => ({
  packId,
  pageUrl: `/${packId}/page-0.json`,
  entries,
});

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(pickerScope);
  runtime.anchor(iconEditorScope);
  return runtime;
};

describe('packSelectedTopic', () => {
  it('switches the active pack and resets filter/page state, landing on the detail view', () => {
    const { commit, peek } = setup();
    commit(searchChangedTopic('foo'));
    commit(pageChangedTopic(5));

    commit(packSelectedTopic('tabler'));

    expect(peek(pickerStore).activePackId).toBe('tabler');
    expect(peek(pickerStore).search).toBe('');
    expect(peek(pickerStore).currentPage).toBe(0);
    expect(peek(pickerStore).view).toBe('pack-detail');
  });

  it('drops manifests and bodies that no longer belong to the active pack', () => {
    const { commit, peek } = setup();
    commit(manifestLoadedTopic(manifest('mdi', ['home'])));
    commit(manifestLoadedTopic(manifest('tabler', ['rocket'])));
    commit(pageIngestedTopic(pageResult('mdi', [entry('home')])));
    commit(pageIngestedTopic(pageResult('tabler', [entry('rocket')])));

    commit(packSelectedTopic('mdi'));

    expect(Object.keys(peek(pickerStore).manifests)).toEqual(['mdi']);
    expect(peek(iconEntriesCell).has(entryKey('mdi', 'home'))).toBe(true);
    expect(peek(iconEntriesCell).has(entryKey('tabler', 'rocket'))).toBe(false);
  });

  it('drops the request ledger alongside the data, so a revisited pack refetches instead of looking permanently fulfilled', () => {
    const { commit, peek } = setup();
    commit(
      packAssetsRequestedTopic({ packId: 'tabler', urls: ['/tabler/a.json'] }),
    );

    commit(packSelectedTopic('mdi'));

    expect(peek(pickerStore).requested.tabler).toBeUndefined();
  });
});

describe('packAssetsRequestedTopic', () => {
  it('accumulates URLs per pack without recording a duplicate', () => {
    const { commit, peek } = setup();

    commit(packAssetsRequestedTopic({ packId: 'mdi', urls: ['/a.json'] }));
    commit(
      packAssetsRequestedTopic({ packId: 'mdi', urls: ['/a.json', '/b.json'] }),
    );

    expect(peek(pickerStore).requested.mdi).toEqual(['/a.json', '/b.json']);
  });
});

describe('searchChangedTopic', () => {
  it('snaps the page index back to 0 so results aren’t hidden behind a stale page', () => {
    const { commit, peek } = setup();
    commit(pageChangedTopic(7));

    commit(searchChangedTopic('home'));

    expect(peek(pickerStore).search).toBe('home');
    expect(peek(pickerStore).currentPage).toBe(0);
  });
});

describe('pickerViewChangedTopic / packSearchChangedTopic / pageChangedTopic / packsLoadedTopic', () => {
  it('write the corresponding fields', () => {
    const { commit, peek } = setup();

    commit(pickerViewChangedTopic('pack-info'));
    commit(packSearchChangedTopic('mat'));
    commit(pageChangedTopic(3));
    commit(packsLoadedTopic([pack('mdi'), pack('tabler')]));

    expect(peek(pickerStore).view).toBe('pack-info');
    expect(peek(pickerStore).packSearch).toBe('mat');
    expect(peek(pickerStore).currentPage).toBe(3);
    expect(peek(pickerStore).packs).toHaveLength(2);
  });
});

describe('pageIngestedTopic', () => {
  it('bulk-inserts a chunk and bumps the version exactly once', () => {
    const { commit, peek } = setup();

    commit(
      pageIngestedTopic(
        pageResult('mdi', [entry('home'), entry('plus'), entry('minus')]),
      ),
    );

    expect(peek(iconEntriesCell).size).toBe(3);
    expect(peek(pickerStore).entriesVersion).toBe(1);
  });

  it('preserves reference identity for entries already cached — a fresh object would re-bind the tile’s innerHTML and restart its CSS animations', () => {
    const { commit, peek } = setup();
    const original = entry('home');
    commit(pageIngestedTopic(pageResult('mdi', [original])));
    const versionBefore = peek(pickerStore).entriesVersion;

    commit(pageIngestedTopic(pageResult('mdi', [entry('home')])));

    expect(peek(iconEntriesCell).get(entryKey('mdi', 'home'))).toBe(original);
    expect(peek(pickerStore).entriesVersion).toBe(versionBefore);
  });
});

describe('pageViewFormula', () => {
  const names = ['alpha', 'beta', 'gamma', 'delta'];
  const paged = manifest('mdi', names, {
    pages: ['/mdi/page-0.json', '/mdi/page-1.json'],
    pageStart: [0, 2],
  });

  it('is empty until the manifest lands', () => {
    const { peek } = setup();

    expect(peek(pageViewFormula).manifest).toBeUndefined();
    expect(peek(pageViewFormula).names).toEqual([]);
  });

  it('maps each unfiltered page 1:1 onto an asset chunk, so paging costs exactly one fetch', () => {
    const { commit, peek } = setup();
    commit(manifestLoadedTopic(paged));

    expect(peek(pageViewFormula).names).toEqual(['alpha', 'beta']);
    expect(peek(pageViewFormula).chunks).toEqual([0]);
    expect(peek(pageViewFormula).pageCount).toBe(2);

    commit(pageChangedTopic(1));

    expect(peek(pageViewFormula).names).toEqual(['gamma', 'delta']);
    expect(peek(pageViewFormula).chunks).toEqual([1]);
    expect(peek(pageViewFormula).start).toBe(2);
  });

  it('slices a fixed page over the matches when filtered, carrying each match’s owning chunk', () => {
    const { commit, peek } = setup();
    commit(manifestLoadedTopic(paged));

    commit(searchChangedTopic('a'));

    expect(peek(pageViewFormula).names).toEqual([
      'alpha',
      'beta',
      'gamma',
      'delta',
    ]);
    expect(peek(pageViewFormula).chunks).toEqual([0, 1]);
    expect(peek(pageViewFormula).total).toBe(4);
  });

  it('clamps a stale page index when a search shrinks the result set past it', () => {
    const { commit, peek } = setup();
    commit(manifestLoadedTopic(paged));
    commit(pageChangedTopic(1));

    commit(searchChangedTopic('alpha'));

    expect(peek(pageViewFormula).page).toBe(0);
    expect(peek(pageViewFormula).names).toEqual(['alpha']);
  });
});

describe('missingPackDataFormula', () => {
  it('reports nothing until the pack catalog lands', () => {
    const { peek } = setup();

    expect(peek(missingPackDataFormula)).toEqual({
      manifest: undefined,
      pages: [],
    });
  });

  it('asks for the active pack’s manifest first — everything else waits on it', () => {
    const { commit, peek } = setup();
    commit(packsLoadedTopic([pack('mdi')]));

    expect(peek(missingPackDataFormula).manifest?.id).toBe('mdi');
    expect(peek(missingPackDataFormula).pages).toEqual([]);
  });

  it('asks for the chunks backing the visible tiles once the manifest is in', () => {
    const { commit, peek } = setup();
    commit(packsLoadedTopic([pack('mdi')]));
    commit(manifestLoadedTopic(manifest('mdi', ['home'])));

    expect(peek(missingPackDataFormula)).toEqual({
      manifest: undefined,
      pages: [{ packId: 'mdi', pageUrl: '/mdi/page-0.json' }],
    });
  });

  it('stops asking for a manifest already in flight', () => {
    const { commit, peek } = setup();
    commit(packsLoadedTopic([pack('mdi')]));

    commit(
      packAssetsRequestedTopic({
        packId: 'mdi',
        urls: ['/mdi/manifest.json'],
      }),
    );

    expect(peek(missingPackDataFormula).manifest).toBeUndefined();
  });

  it('stops asking for a chunk already in flight', () => {
    const { commit, peek } = setup();
    commit(packsLoadedTopic([pack('mdi')]));
    commit(manifestLoadedTopic(manifest('mdi', ['home'])));

    commit(
      packAssetsRequestedTopic({
        packId: 'mdi',
        urls: ['/mdi/page-0.json'],
      }),
    );

    expect(peek(missingPackDataFormula).pages).toEqual([]);
  });

  it('stops asking for a chunk that already landed, even one a resolve dragged in', () => {
    const { commit, peek } = setup();
    commit(packsLoadedTopic([pack('mdi')]));
    commit(manifestLoadedTopic(manifest('mdi', ['home'])));

    commit(pageIngestedTopic(pageResult('mdi', [entry('home')])));

    expect(peek(missingPackDataFormula).pages).toEqual([]);
  });
});
