import { createTestBindings } from '@lib/state';
import {
  ingestPage,
  openPack,
  releaseInactivePacks,
  seedEntry,
  setCurrentPage,
  setManifest,
  setPackSearch,
  setPacks,
  setSearch,
  setView,
} from '../bindings';
import { pickerStore } from '../store';
import type {
  IconEntry,
  IconPackManifest,
  IconPackSummary,
  IconPageResult,
} from '../../../icons';

const entry = (name: string, body = '<path/>'): IconEntry => ({
  name,
  body,
});

const manifest = (id: string, names: string[]): IconPackManifest => ({
  id,
  name: id,
  width: 24,
  height: 24,
  total: names.length,
  names,
  pages: [`/${id}/page-0.json`],
  pageStart: [0],
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
  const bindings = createTestBindings();
  return {
    ...bindings,
    picker: bindings.createStore(pickerStore),
  };
};

describe('openPack', () => {
  it('switches the active pack and resets filter/page state, landing on the detail view', () => {
    const { picker, useAction } = setup();
    useAction(setSearch)('foo');
    useAction(setCurrentPage)(5);

    useAction(openPack)('tabler');

    expect(picker.activePackId).toBe('tabler');
    expect(picker.search).toBe('');
    expect(picker.currentPage).toBe(0);
    expect(picker.view).toBe('pack-detail');
  });
});

describe('setSearch', () => {
  it('snaps the page index back to 0 so search results aren’t hidden behind a stale page', () => {
    const { picker, useAction } = setup();
    useAction(setCurrentPage)(7);

    useAction(setSearch)('home');

    expect(picker.search).toBe('home');
    expect(picker.currentPage).toBe(0);
  });
});

describe('setView / setPackSearch / setCurrentPage / setPacks / setManifest', () => {
  it('write the corresponding fields', () => {
    const { picker, useAction } = setup();

    useAction(setView)('pack-info');
    useAction(setPackSearch)('mat');
    useAction(setCurrentPage)(3);
    useAction(setPacks)([pack('mdi'), pack('tabler')]);
    useAction(setManifest)(manifest('mdi', ['home']));

    expect(picker.view).toBe('pack-info');
    expect(picker.packSearch).toBe('mat');
    expect(picker.currentPage).toBe(3);
    expect(picker.packs).toHaveLength(2);
    expect(picker.manifests.mdi?.names).toEqual(['home']);
  });
});

describe('seedEntry', () => {
  it('inserts a new entry and bumps the version', () => {
    const { picker, useAction } = setup();

    useAction(seedEntry)({ pack: 'mdi', entry: entry('home') });

    expect(picker.entries.current.get('mdi:home')?.name).toBe('home');
    expect(picker.entriesVersion).toBe(1);
  });

  it('skips when the entry is already cached — preserves reference identity so tile innerHTML bindings don’t restart CSS animations', () => {
    const { picker, useAction } = setup();
    const original = entry('home');
    useAction(seedEntry)({ pack: 'mdi', entry: original });

    useAction(seedEntry)({ pack: 'mdi', entry: entry('home') });

    expect(picker.entries.current.get('mdi:home')).toBe(original);
    expect(picker.entriesVersion).toBe(1);
  });
});

describe('ingestPage', () => {
  it('bulk-inserts a chunk and bumps the version exactly once', () => {
    const { picker, useAction } = setup();

    useAction(ingestPage)(
      pageResult('mdi', [entry('home'), entry('plus'), entry('minus')]),
    );

    expect(picker.entries.current.size).toBe(3);
    expect(picker.entriesVersion).toBe(1);
  });

  it('skips entries that were already seeded and doesn’t bump when nothing was added', () => {
    const { picker, useAction } = setup();
    const original = entry('home');
    useAction(seedEntry)({ pack: 'mdi', entry: original });

    useAction(ingestPage)(pageResult('mdi', [entry('home')]));

    expect(picker.entries.current.get('mdi:home')).toBe(original);
    expect(picker.entriesVersion).toBe(1);
  });
});

describe('releaseInactivePacks', () => {
  it('drops manifests + entries that don’t belong to the active pack', () => {
    const { picker, useAction } = setup();
    useAction(setManifest)(manifest('mdi', ['home']));
    useAction(setManifest)(manifest('tabler', ['rocket']));
    useAction(seedEntry)({ pack: 'mdi', entry: entry('home') });
    useAction(seedEntry)({ pack: 'tabler', entry: entry('rocket') });

    useAction(releaseInactivePacks)('mdi');

    expect(Object.keys(picker.manifests)).toEqual(['mdi']);
    expect(picker.entries.current.has('mdi:home')).toBe(true);
    expect(picker.entries.current.has('tabler:rocket')).toBe(false);
  });

  it('leaves the version untouched when no entries needed dropping', () => {
    const { picker, useAction } = setup();
    useAction(seedEntry)({ pack: 'mdi', entry: entry('home') });
    const versionBefore = picker.entriesVersion;

    useAction(releaseInactivePacks)('mdi');

    expect(picker.entriesVersion).toBe(versionBefore);
  });
});
