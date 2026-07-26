import { createTestRuntime } from '@lib/state-next';
import {
  entryKey,
  iconEntries,
  manifestLoaded,
  missingPackData,
  packSearchChanged,
  packSelected,
  packsLoaded,
  pageChanged,
  pageIngested,
  pageView,
  picker,
  pickerScope,
  pickerViewChanged,
  searchChanged,
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

describe('packSelected', () => {
  it('switches the active pack and resets filter/page state, landing on the detail view', () => {
    const { commit, peek } = setup();
    commit(searchChanged('foo'));
    commit(pageChanged(5));

    commit(packSelected('tabler'));

    expect(peek(picker).activePackId).toBe('tabler');
    expect(peek(picker).search).toBe('');
    expect(peek(picker).currentPage).toBe(0);
    expect(peek(picker).view).toBe('pack-detail');
  });

  it('drops manifests and bodies that no longer belong to the active pack', () => {
    const { commit, peek } = setup();
    commit(manifestLoaded(manifest('mdi', ['home'])));
    commit(manifestLoaded(manifest('tabler', ['rocket'])));
    commit(pageIngested(pageResult('mdi', [entry('home')])));
    commit(pageIngested(pageResult('tabler', [entry('rocket')])));

    commit(packSelected('mdi'));

    expect(Object.keys(peek(picker).manifests)).toEqual(['mdi']);
    expect(peek(iconEntries).has(entryKey('mdi', 'home'))).toBe(true);
    expect(peek(iconEntries).has(entryKey('tabler', 'rocket'))).toBe(false);
  });
});

describe('searchChanged', () => {
  it('snaps the page index back to 0 so results aren’t hidden behind a stale page', () => {
    const { commit, peek } = setup();
    commit(pageChanged(7));

    commit(searchChanged('home'));

    expect(peek(picker).search).toBe('home');
    expect(peek(picker).currentPage).toBe(0);
  });
});

describe('pickerViewChanged / packSearchChanged / pageChanged / packsLoaded', () => {
  it('write the corresponding fields', () => {
    const { commit, peek } = setup();

    commit(pickerViewChanged('pack-info'));
    commit(packSearchChanged('mat'));
    commit(pageChanged(3));
    commit(packsLoaded([pack('mdi'), pack('tabler')]));

    expect(peek(picker).view).toBe('pack-info');
    expect(peek(picker).packSearch).toBe('mat');
    expect(peek(picker).currentPage).toBe(3);
    expect(peek(picker).packs).toHaveLength(2);
  });
});

describe('pageIngested', () => {
  it('bulk-inserts a chunk and bumps the version exactly once', () => {
    const { commit, peek } = setup();

    commit(
      pageIngested(
        pageResult('mdi', [entry('home'), entry('plus'), entry('minus')]),
      ),
    );

    expect(peek(iconEntries).size).toBe(3);
    expect(peek(picker).entriesVersion).toBe(1);
  });

  it('preserves reference identity for entries already cached — a fresh object would re-bind the tile’s innerHTML and restart its CSS animations', () => {
    const { commit, peek } = setup();
    const original = entry('home');
    commit(pageIngested(pageResult('mdi', [original])));
    const versionBefore = peek(picker).entriesVersion;

    commit(pageIngested(pageResult('mdi', [entry('home')])));

    expect(peek(iconEntries).get(entryKey('mdi', 'home'))).toBe(original);
    expect(peek(picker).entriesVersion).toBe(versionBefore);
  });
});

describe('pageView', () => {
  const names = ['alpha', 'beta', 'gamma', 'delta'];
  const paged = manifest('mdi', names, {
    pages: ['/mdi/page-0.json', '/mdi/page-1.json'],
    pageStart: [0, 2],
  });

  it('is empty until the manifest lands', () => {
    const { peek } = setup();

    expect(peek(pageView).manifest).toBeUndefined();
    expect(peek(pageView).names).toEqual([]);
  });

  it('maps each unfiltered page 1:1 onto an asset chunk, so paging costs exactly one fetch', () => {
    const { commit, peek } = setup();
    commit(manifestLoaded(paged));

    expect(peek(pageView).names).toEqual(['alpha', 'beta']);
    expect(peek(pageView).chunks).toEqual([0]);
    expect(peek(pageView).pageCount).toBe(2);

    commit(pageChanged(1));

    expect(peek(pageView).names).toEqual(['gamma', 'delta']);
    expect(peek(pageView).chunks).toEqual([1]);
    expect(peek(pageView).start).toBe(2);
  });

  it('slices a fixed page over the matches when filtered, carrying each match’s owning chunk', () => {
    const { commit, peek } = setup();
    commit(manifestLoaded(paged));

    commit(searchChanged('a'));

    expect(peek(pageView).names).toEqual(['alpha', 'beta', 'gamma', 'delta']);
    expect(peek(pageView).chunks).toEqual([0, 1]);
    expect(peek(pageView).total).toBe(4);
  });

  it('clamps a stale page index when a search shrinks the result set past it', () => {
    const { commit, peek } = setup();
    commit(manifestLoaded(paged));
    commit(pageChanged(1));

    commit(searchChanged('alpha'));

    expect(peek(pageView).page).toBe(0);
    expect(peek(pageView).names).toEqual(['alpha']);
  });
});

describe('missingPackData', () => {
  it('reports nothing until the pack catalog lands', () => {
    const { peek } = setup();

    expect(peek(missingPackData)).toEqual({ manifest: undefined, pages: [] });
  });

  it('asks for the active pack’s manifest first — everything else waits on it', () => {
    const { commit, peek } = setup();
    commit(packsLoaded([pack('mdi')]));

    expect(peek(missingPackData).manifest?.id).toBe('mdi');
    expect(peek(missingPackData).pages).toEqual([]);
  });

  it('asks for the chunks backing the visible tiles once the manifest is in', () => {
    const { commit, peek } = setup();
    commit(packsLoaded([pack('mdi')]));
    commit(manifestLoaded(manifest('mdi', ['home'])));

    expect(peek(missingPackData)).toEqual({
      manifest: undefined,
      pages: [{ packId: 'mdi', pageUrl: '/mdi/page-0.json' }],
    });
  });
});
