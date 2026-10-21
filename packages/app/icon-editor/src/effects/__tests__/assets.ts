/// <reference types="@dev/vite-plugin-icon-packs/types" />

import indexUrl from 'virtual:icon-packs';
import type { IconEntry, IconPackManifest, IconPackSummary } from '../../icons';

export const MANIFEST_URL = '/packs/mdi.json';
export const PAGE_URLS = ['/packs/mdi/0.json', '/packs/mdi/1.json'];

export const samplePack: IconPackSummary = {
  id: 'mdi',
  name: 'Material Design Icons',
  total: 3,
  width: 24,
  height: 24,
  samples: [],
  manifestUrl: MANIFEST_URL,
};

export const sampleManifest: IconPackManifest = {
  id: 'mdi',
  name: 'Material Design Icons',
  width: 24,
  height: 24,
  total: 3,
  names: ['cog', 'home', 'star'],
  pages: PAGE_URLS,
  pageStart: [0, 2],
};

export const cogEntry: IconEntry = { name: 'cog', body: '<path d="M1 1"/>' };
export const homeEntry: IconEntry = { name: 'home', body: '<path d="M0 0"/>' };
export const starEntry: IconEntry = { name: 'star', body: '<path d="M2 2"/>' };

const ASSETS: Record<string, unknown> = {
  [indexUrl]: { packs: [samplePack] },
  [MANIFEST_URL]: sampleManifest,
  [PAGE_URLS[0]]: [cogEntry, homeEntry],
  [PAGE_URLS[1]]: [starEntry],
};

/**
 * Serve the sample pack's assets from `fetch` for the rest of the test.
 * Anything else is a 404. Returns the spy, to count requests.
 */
export const serveAssets = () => {
  const fetch = vi.fn(async (url: string) =>
    url in ASSETS
      ? Response.json(ASSETS[url])
      : new Response(null, { status: 404 }),
  );

  vi.stubGlobal('fetch', fetch);
  onTestFinished(() => {
    vi.unstubAllGlobals();
  });

  return fetch;
};
