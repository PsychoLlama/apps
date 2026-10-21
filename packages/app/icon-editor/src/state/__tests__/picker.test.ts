import { createTestController } from '@lib/effects/testing';
import {
  $iconEntries,
  $manifestLoaded,
  $packAssetsRequested,
  $packSearchChanged,
  $packsLoaded,
  $pageChanged,
  $pageIngested,
  $picker,
  $pickerViewChanged,
  $searchChanged,
  entryKey,
  missingPackDataOf,
  pageViewOf,
  type PickerState,
} from '../picker';
import { $packChosen } from '../editor';
import type {
  IconEntry,
  IconPackManifest,
  IconPackSummary,
  IconPageResult,
} from '../../icons';

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

/** Picker state with only the fields a test cares about overridden. */
const pickerState = (overrides: Partial<PickerState> = {}): PickerState => ({
  view: 'pack-detail',
  activePackId: 'mdi',
  search: '',
  packSearch: '',
  currentPage: 0,
  packs: undefined,
  manifests: {},
  requested: {},
  entriesVersion: 0,
  ...overrides,
});

describe('$packChosen', () => {
  it('switches the active pack and resets filter/page state, landing on the detail view', async () => {
    await using effects = createTestController();
    const picker = await effects.run($picker);
    const searchChanged = await effects.run($searchChanged);
    const pageChanged = await effects.run($pageChanged);
    const packChosen = await effects.run($packChosen);

    searchChanged('home');
    pageChanged(3);
    packChosen('tabler');

    expect(picker).toMatchObject({
      activePackId: 'tabler',
      search: '',
      currentPage: 0,
      view: 'pack-detail',
    });
  });

  it('drops manifests and bodies that no longer belong to the active pack', async () => {
    await using effects = createTestController();
    const picker = await effects.run($picker);
    const entries = await effects.run($iconEntries);
    const manifestLoaded = await effects.run($manifestLoaded);
    const pageIngested = await effects.run($pageIngested);
    const packChosen = await effects.run($packChosen);

    manifestLoaded(manifest('mdi', ['home']));
    manifestLoaded(manifest('tabler', ['rocket']));
    pageIngested(pageResult('mdi', [entry('home')]));
    pageIngested(pageResult('tabler', [entry('rocket')]));
    packChosen('tabler');

    expect(Object.keys(picker.manifests)).toEqual(['tabler']);
    expect([...entries().keys()]).toEqual([entryKey('tabler', 'rocket')]);
  });

  it('drops the request ledger alongside the data, so a revisited pack refetches instead of looking permanently fulfilled', async () => {
    await using effects = createTestController();
    const picker = await effects.run($picker);
    const packAssetsRequested = await effects.run($packAssetsRequested);
    const packChosen = await effects.run($packChosen);

    packAssetsRequested('mdi', ['/mdi/manifest.json']);
    packChosen('tabler');

    expect(picker.requested).toEqual({});
  });
});

describe('$packAssetsRequested', () => {
  it('accumulates URLs per pack without recording a duplicate', async () => {
    await using effects = createTestController();
    const picker = await effects.run($picker);
    const packAssetsRequested = await effects.run($packAssetsRequested);

    packAssetsRequested('mdi', ['/a.json']);
    packAssetsRequested('mdi', ['/a.json', '/b.json']);

    expect(picker.requested).toEqual({ mdi: ['/a.json', '/b.json'] });
  });
});

describe('$searchChanged', () => {
  it('snaps the page index back to 0 so results aren’t hidden behind a stale page', async () => {
    await using effects = createTestController();
    const picker = await effects.run($picker);
    const pageChanged = await effects.run($pageChanged);
    const searchChanged = await effects.run($searchChanged);

    pageChanged(4);
    searchChanged('arrow');

    expect(picker).toMatchObject({ search: 'arrow', currentPage: 0 });
  });
});

describe('$pickerViewChanged / $packSearchChanged / $pageChanged / $packsLoaded', () => {
  it('write the corresponding fields', async () => {
    await using effects = createTestController();
    const picker = await effects.run($picker);
    const pickerViewChanged = await effects.run($pickerViewChanged);
    const packSearchChanged = await effects.run($packSearchChanged);
    const pageChanged = await effects.run($pageChanged);
    const packsLoaded = await effects.run($packsLoaded);
    const packs = [pack('mdi')];

    pickerViewChanged('pack-info');
    packSearchChanged('material');
    pageChanged(2);
    packsLoaded(packs);

    expect(picker).toMatchObject({
      view: 'pack-info',
      packSearch: 'material',
      currentPage: 2,
      packs,
    });
  });
});

describe('$pageIngested', () => {
  it('bulk-inserts a chunk and bumps the version exactly once', async () => {
    await using effects = createTestController();
    const picker = await effects.run($picker);
    const entries = await effects.run($iconEntries);
    const pageIngested = await effects.run($pageIngested);

    pageIngested(pageResult('mdi', [entry('home'), entry('cog')]));

    expect(entries().size).toBe(2);
    expect(picker.entriesVersion).toBe(1);
    expect(picker.requested).toEqual({ mdi: ['/mdi/page-0.json'] });
  });

  it('preserves reference identity for entries already cached — a fresh object would re-bind the tile’s innerHTML and restart its CSS animations', async () => {
    await using effects = createTestController();
    const picker = await effects.run($picker);
    const entries = await effects.run($iconEntries);
    const pageIngested = await effects.run($pageIngested);
    const original = entry('home');

    pageIngested(pageResult('mdi', [original]));
    pageIngested(pageResult('mdi', [entry('home')]));

    expect(entries().get(entryKey('mdi', 'home'))).toBe(original);
    expect(picker.entriesVersion).toBe(1);
  });
});

describe('pageViewOf', () => {
  const chunked = manifest('mdi', ['a', 'ab', 'b', 'bc', 'c'], {
    pages: ['/mdi/0.json', '/mdi/1.json'],
    pageStart: [0, 3],
  });

  it('is empty until the manifest lands', () => {
    expect(pageViewOf(pickerState())).toMatchObject({
      manifest: undefined,
      names: [],
      pageCount: 1,
    });
  });

  it('maps each unfiltered page 1:1 onto an asset chunk, so paging costs exactly one fetch', () => {
    const view = pageViewOf(
      pickerState({ manifests: { mdi: chunked }, currentPage: 1 }),
    );

    expect(view).toMatchObject({
      names: ['bc', 'c'],
      chunks: [1],
      start: 3,
      total: 5,
      page: 1,
      pageCount: 2,
    });
  });

  it('slices a fixed page over the matches when filtered, carrying each match’s owning chunk', () => {
    const view = pageViewOf(
      pickerState({ manifests: { mdi: chunked }, search: 'B' }),
    );

    expect(view).toMatchObject({
      names: ['ab', 'b', 'bc'],
      chunks: [0, 1],
      total: 3,
      pageCount: 1,
    });
  });

  it('clamps a stale page index when a search shrinks the result set past it', () => {
    const view = pageViewOf(
      pickerState({ manifests: { mdi: chunked }, search: 'c', currentPage: 5 }),
    );

    expect(view.page).toBe(0);
  });
});

describe('missingPackDataOf', () => {
  const mdi = pack('mdi');
  const mdiManifest = manifest('mdi', ['home']);

  const missingFor = (overrides: Partial<PickerState>) => {
    const state = pickerState(overrides);
    return missingPackDataOf(state, pageViewOf(state));
  };

  it('reports nothing until the pack catalog lands', () => {
    expect(missingFor({})).toEqual({ manifest: undefined, pages: [] });
  });

  it('asks for the active pack’s manifest first — everything else waits on it', () => {
    expect(missingFor({ packs: [mdi] })).toEqual({ manifest: mdi, pages: [] });
  });

  it('asks for the chunks backing the visible tiles once the manifest is in', () => {
    expect(
      missingFor({ packs: [mdi], manifests: { mdi: mdiManifest } }),
    ).toEqual({
      manifest: undefined,
      pages: [{ packId: 'mdi', pageUrl: '/mdi/page-0.json' }],
    });
  });

  it('stops asking for a manifest already in flight', () => {
    expect(
      missingFor({ packs: [mdi], requested: { mdi: [mdi.manifestUrl] } }),
    ).toEqual({ manifest: undefined, pages: [] });
  });

  it('stops asking for a chunk already in flight or landed', () => {
    expect(
      missingFor({
        packs: [mdi],
        manifests: { mdi: mdiManifest },
        requested: { mdi: [mdi.manifestUrl, '/mdi/page-0.json'] },
      }),
    ).toEqual({ manifest: undefined, pages: [] });
  });
});
