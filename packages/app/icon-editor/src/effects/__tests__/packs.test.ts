import { createTestController } from '@lib/effects/testing';
import { $iconEntries, $picker, entryKey } from '../../state';
import {
  $loadManifest,
  $loadMissingPackData,
  $loadPage,
  $packIndex,
} from '../packs';
import {
  MANIFEST_URL,
  PAGE_URLS,
  sampleManifest,
  samplePack,
  serveAssets,
} from './assets';

describe('$packIndex', () => {
  it('lands the catalog in the picker', async () => {
    serveAssets();
    await using effects = createTestController();
    const picker = await effects.run($picker);

    const packs = await effects.run($packIndex);

    expect(packs).toEqual([samplePack]);
    expect(picker.packs).toEqual([samplePack]);
  });

  it('fetches once for every holder', async () => {
    const fetch = serveAssets();
    await using effects = createTestController();

    await Promise.all([effects.run($packIndex), effects.run($packIndex)]);

    expect(fetch).toHaveBeenCalledOnce();
  });
});

describe('$loadManifest', () => {
  it('lands the manifest, marking it requested first', async () => {
    serveAssets();
    await using effects = createTestController();
    const picker = await effects.run($picker);
    const loadManifest = await effects.run($loadManifest);

    const pending = loadManifest(samplePack);
    expect(picker.requested).toEqual({ mdi: [MANIFEST_URL] });

    await expect(pending).resolves.toEqual(sampleManifest);
    expect(picker.manifests).toEqual({ mdi: sampleManifest });
  });

  it('skips the fetch once the manifest is in state', async () => {
    const fetch = serveAssets();
    await using effects = createTestController();
    const loadManifest = await effects.run($loadManifest);

    await loadManifest(samplePack);
    await loadManifest(samplePack);

    expect(fetch).toHaveBeenCalledOnce();
  });

  it('fails loudly when an asset is missing', async () => {
    serveAssets();
    await using effects = createTestController();
    const loadManifest = await effects.run($loadManifest);

    await expect(
      loadManifest({ ...samplePack, manifestUrl: '/missing.json' }),
    ).rejects.toThrow('/missing.json');
  });
});

describe('$loadPage', () => {
  it('lands a chunk’s bodies in the entry cache', async () => {
    serveAssets();
    await using effects = createTestController();
    const entries = await effects.run($iconEntries);
    const loadPage = await effects.run($loadPage);

    await loadPage({ packId: 'mdi', pageUrl: PAGE_URLS[0] });

    expect([...entries().keys()]).toEqual([
      entryKey('mdi', 'cog'),
      entryKey('mdi', 'home'),
    ]);
  });

  it('skips a chunk already asked for', async () => {
    const fetch = serveAssets();
    await using effects = createTestController();
    const loadPage = await effects.run($loadPage);
    const request = { packId: 'mdi', pageUrl: PAGE_URLS[0] };

    await Promise.all([loadPage(request), loadPage(request)]);

    expect(fetch).toHaveBeenCalledOnce();
  });
});

describe('$loadMissingPackData', () => {
  it('loads the manifest alone while it’s missing', async () => {
    const fetch = serveAssets();
    await using effects = createTestController();
    const loadMissing = await effects.run($loadMissingPackData);

    await loadMissing({ manifest: samplePack, pages: [] });

    expect(fetch.mock.calls.map(([url]) => url)).toEqual([MANIFEST_URL]);
  });

  it('loads every missing chunk', async () => {
    serveAssets();
    await using effects = createTestController();
    const entries = await effects.run($iconEntries);
    const loadMissing = await effects.run($loadMissingPackData);

    await loadMissing({
      manifest: undefined,
      pages: PAGE_URLS.map((pageUrl) => ({ packId: 'mdi', pageUrl })),
    });

    expect(entries().size).toBe(3);
  });
});
