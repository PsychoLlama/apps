/**
 * Behavioral tests for the SW's fetch dispatch + navigation strategy.
 * Cache Storage is real (provided by Chromium); only `fetch` and
 * `navigator.onLine` are stubbed so we can drive the network branches
 * deterministically.
 */

import { type Mock } from 'vitest';

import { enabled as scratchpadAppEnabled } from '@app/scratchpad/config';
import { enabled as beamAppEnabled } from '@app/beam/config';
import { reset, updateConfig } from '@lib/runtime-config';

import { CACHE_NAMES } from '../caches';
import {
  handleFetch,
  handleNavigation,
  NAVIGATION_TIMEOUT_MS,
  type NavigationContext,
} from '../fetch-handler';

const sameOrigin = (path: string): string =>
  new URL(path, self.location.origin).toString();

/** Spy standing in for `self.fetch`; re-created before each test. */
let fetchSpy: Mock;

/** Spy standing in for `waitUntil`; collects the handler's background work. */
let waitUntil: Mock<(promise: Promise<unknown>) => void>;

/**
 * Builds a navigation context, defaulting the parts a given test doesn't
 * exercise: the shared `waitUntil` spy and a preload that resolves to
 * nothing (so the handler falls back to `fetch`). Override either to
 * drive the preload / cache-refresh paths.
 */
const navContext = (
  request: Request,
  overrides: Partial<NavigationContext> = {},
): NavigationContext => ({
  request,
  waitUntil,
  preloadResponse: Promise.resolve(undefined),
  ...overrides,
});

/** Awaits the background work captured by the `waitUntil` spy. */
const flushBackground = (): Promise<unknown> =>
  Promise.all(waitUntil.mock.calls.map(([promise]) => promise));

/** Seeds the HTML cache with a navigation response. */
const seedCache = async (path: string, body: string): Promise<void> => {
  const cache = await caches.open(CACHE_NAMES.html);
  await cache.put(
    new Request(sameOrigin(path)),
    new Response(body, { status: 200 }),
  );
};

/** Reads a navigation body back out of the HTML cache. */
const readCache = async (path: string): Promise<string | undefined> => {
  const cache = await caches.open(CACHE_NAMES.html);
  const cached = await cache.match(sameOrigin(path));
  return cached?.text();
};

/** Forces the UA's reachability signal to report offline. */
const goOffline = (): void => {
  vi.spyOn(self.navigator, 'onLine', 'get').mockReturnValue(false);
};

beforeEach(() => {
  vi.useFakeTimers();
  fetchSpy = vi.fn();
  waitUntil = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(async () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  // `vi.spyOn` getters (e.g. `navigator.onLine`) aren't reverted by
  // `unstubAllGlobals`; restore them so the offline branch doesn't leak.
  vi.restoreAllMocks();
  await caches.delete(CACHE_NAMES.html);
});

describe('handleNavigation', () => {
  it('returns the network response and refreshes the cache on success', async () => {
    fetchSpy.mockResolvedValue(
      new Response('<html>fresh</html>', { status: 200 }),
    );

    const response = await handleNavigation(
      navContext(new Request(sameOrigin('/settings'))),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('<html>fresh</html>');

    await flushBackground();
    expect(await readCache('/settings')).toBe('<html>fresh</html>');
  });

  it('does not cache non-OK responses', async () => {
    fetchSpy.mockResolvedValue(new Response('missing', { status: 404 }));

    const response = await handleNavigation(
      navContext(new Request(sameOrigin('/missing'))),
    );

    expect(response.status).toBe(404);
    await flushBackground();
    expect(await readCache('/missing')).toBeUndefined();
  });

  it('falls back to the cache on network failure', async () => {
    await seedCache('/settings', '<html>stale</html>');
    fetchSpy.mockRejectedValue(new TypeError('Offline'));

    const response = await handleNavigation(
      navContext(new Request(sameOrigin('/settings'))),
    );

    expect(await response.text()).toBe('<html>stale</html>');
  });

  it('rejects when the network fails and the cache has no entry', async () => {
    fetchSpy.mockRejectedValue(new TypeError('Offline'));

    await expect(
      handleNavigation(navContext(new Request(sameOrigin('/never-visited')))),
    ).rejects.toThrow();
  });

  it('serves cached navigations without fetching when the UA reports offline', async () => {
    await seedCache('/settings', '<html>stale</html>');
    goOffline();

    const response = await handleNavigation(
      navContext(new Request(sameOrigin('/settings')), {
        // A rejecting preload stands in for the doomed request the
        // browser kicks off while offline.
        preloadResponse: Promise.reject(new TypeError('Offline')),
      }),
    );

    expect(await response.text()).toBe('<html>stale</html>');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('re-throws without fetching when the UA reports offline and the cache is empty', async () => {
    goOffline();

    await expect(
      handleNavigation(
        navContext(new Request(sameOrigin('/never-visited')), {
          preloadResponse: Promise.reject(new TypeError('Offline')),
        }),
      ),
    ).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('serves the cached entry when the network is slower than the timeout', async () => {
    const cache = await caches.open(CACHE_NAMES.html);
    await cache.put(
      new Request(sameOrigin('/settings')),
      new Response('<html>stale</html>', { status: 200 }),
    );
    // The handler registers its timeout only *after* awaiting
    // `caches.open`, which settles on a Cache Storage task that
    // `advanceTimersByTime` won't wait for — so a real open races the
    // timer registration. Resolve the open on a microtask instead, which
    // the fake clock pumps, making the timeout fire deterministically.
    vi.spyOn(caches, 'open').mockResolvedValue(cache);
    // A fetch that never settles — it just needs to outlast the timeout.
    fetchSpy.mockReturnValue(new Promise<Response>(() => {}));

    const responsePromise = handleNavigation(
      navContext(new Request(sameOrigin('/settings'))),
    );
    await vi.advanceTimersByTimeAsync(NAVIGATION_TIMEOUT_MS);

    const response = await responsePromise;
    expect(await response.text()).toBe('<html>stale</html>');
  });

  it('serves the navigation-preload response without issuing its own fetch', async () => {
    const response = await handleNavigation(
      navContext(new Request(sameOrigin('/settings')), {
        preloadResponse: Promise.resolve(
          new Response('<html>preloaded</html>', { status: 200 }),
        ),
      }),
    );

    expect(await response.text()).toBe('<html>preloaded</html>');
    expect(fetchSpy).not.toHaveBeenCalled();

    // A preload win refreshes the cache just like a fetch win.
    await flushBackground();
    expect(await readCache('/settings')).toBe('<html>preloaded</html>');
  });

  it('falls back to fetch when no preload ran for the navigation', async () => {
    fetchSpy.mockResolvedValue(
      new Response('<html>fresh</html>', { status: 200 }),
    );

    // `navContext` defaults `preloadResponse` to resolve `undefined`.
    const response = await handleNavigation(
      navContext(new Request(sameOrigin('/settings'))),
    );

    expect(await response.text()).toBe('<html>fresh</html>');
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});

interface SyntheticFetchEvent {
  request: Request;
  respondWith: Mock;
  waitUntil: Mock<(promise: Promise<unknown>) => void>;
  preloadResponse: Promise<Response | undefined>;
}

const syntheticEvent = (request: Request): SyntheticFetchEvent => ({
  request,
  respondWith: vi.fn(),
  waitUntil,
  preloadResponse: Promise.resolve(undefined),
});

describe('handleFetch', () => {
  beforeEach(() => {
    // The dev-mode bypass (see below) is the production default under
    // Vite's dev server, but most of these cases assert the prod
    // strategy. Pin `DEV` off so the navigation branch engages; the
    // bypass gets its own case.
    vi.stubEnv('DEV', false);
  });

  it('ignores cross-origin requests', () => {
    const event = syntheticEvent(new Request('https://other.example/page'));
    handleFetch(event as unknown as FetchEvent);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it('short-circuits the local health check with a JSON status', async () => {
    const event = syntheticEvent(new Request(sameOrigin('/api/local/health')));
    handleFetch(event as unknown as FetchEvent);

    expect(event.respondWith).toHaveBeenCalledOnce();
    const [response] = event.respondWith.mock.calls[0] as [Response];
    expect(await response.json()).toEqual({ status: 'online' });
  });

  it('streams the local log archive as ndjson', () => {
    const event = syntheticEvent(new Request(sameOrigin('/api/local/logs')));
    handleFetch(event as unknown as FetchEvent);

    expect(event.respondWith).toHaveBeenCalledOnce();
    const [response] = event.respondWith.mock.calls[0] as [Response];
    expect(response.headers.get('Content-Type')).toBe('application/x-ndjson');
  });

  it('claims GET navigations so they flow through the offline strategy', () => {
    // `mode: 'navigate'` is reserved for the browser — the `Request`
    // constructor refuses it. Override the getter post-hoc so dispatch
    // sees the shape a real navigation has.
    const request = new Request(sameOrigin('/icon-editor'));
    Object.defineProperty(request, 'mode', { value: 'navigate' });
    fetchSpy.mockResolvedValue(new Response('<html/>', { status: 200 }));

    const event = syntheticEvent(request);
    handleFetch(event as unknown as FetchEvent);
    expect(event.respondWith).toHaveBeenCalledOnce();
  });

  it('ignores non-navigation same-origin requests', () => {
    const event = syntheticEvent(
      new Request(sameOrigin('/_build/asset.js'), { mode: 'cors' }),
    );
    handleFetch(event as unknown as FetchEvent);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it('lets navigations fall through to the network in dev mode', () => {
    // A slow Vite dev server can blow the navigation timeout; serving a
    // stale cached shell then desyncs the HMR client and trips a
    // SolidJS hydration error. So in dev the SW stays out of the way.
    vi.stubEnv('DEV', true);

    const request = new Request(sameOrigin('/icon-editor'));
    Object.defineProperty(request, 'mode', { value: 'navigate' });

    const event = syntheticEvent(request);
    handleFetch(event as unknown as FetchEvent);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  describe('scratchpad route gating', () => {
    // The runner resolves to the `development` environment, so overrides
    // target that. `reset` clears the persisted OPFS override between
    // cases so neither leaks the flag into the other.
    afterEach(async () => {
      await reset(scratchpadAppEnabled);
    });

    /** A navigation request to the scratchpad route. */
    const scratchpadNavigation = (): Request => {
      const request = new Request(sameOrigin('/scratchpad'));
      Object.defineProperty(request, 'mode', { value: 'navigate' });
      return request;
    };

    it('serves the 404 page when the flag is disabled', async () => {
      await updateConfig(scratchpadAppEnabled, {
        development: { enabled: false },
      });
      // The shell is fetched at the clean `/404` path and re-served with
      // a 404 status.
      fetchSpy.mockResolvedValue(
        new Response('<html>not found</html>', { status: 200 }),
      );

      const event = syntheticEvent(scratchpadNavigation());
      handleFetch(event as unknown as FetchEvent);

      expect(event.respondWith).toHaveBeenCalledOnce();
      const [response] = event.respondWith.mock.calls[0] as [Promise<Response>];
      const resolved = await response;
      expect(resolved.status).toBe(404);
      expect(await resolved.text()).toBe('<html>not found</html>');
      expect(fetchSpy).toHaveBeenCalledWith('/404');
    });

    it('serves the navigation when the flag is enabled', async () => {
      await updateConfig(scratchpadAppEnabled, {
        development: { enabled: true },
      });
      fetchSpy.mockResolvedValue(
        new Response('<html>scratchpad</html>', { status: 200 }),
      );

      const event = syntheticEvent(scratchpadNavigation());
      handleFetch(event as unknown as FetchEvent);

      expect(event.respondWith).toHaveBeenCalledOnce();
      const [response] = event.respondWith.mock.calls[0] as [Promise<Response>];
      expect((await response).status).toBe(200);
    });
  });

  describe('beam route gating', () => {
    // The runner resolves to the `development` environment, so overrides
    // target that. `reset` clears the persisted OPFS override between
    // cases so neither leaks the flag into the other.
    afterEach(async () => {
      await reset(beamAppEnabled);
    });

    /** A navigation request to the beam route. */
    const beamNavigation = (): Request => {
      const request = new Request(sameOrigin('/beam'));
      Object.defineProperty(request, 'mode', { value: 'navigate' });
      return request;
    };

    it('serves the 404 page when the flag is disabled', async () => {
      await updateConfig(beamAppEnabled, {
        development: { enabled: false },
      });
      // The shell is fetched at the clean `/404` path and re-served with
      // a 404 status.
      fetchSpy.mockResolvedValue(
        new Response('<html>not found</html>', { status: 200 }),
      );

      const event = syntheticEvent(beamNavigation());
      handleFetch(event as unknown as FetchEvent);

      expect(event.respondWith).toHaveBeenCalledOnce();
      const [response] = event.respondWith.mock.calls[0] as [Promise<Response>];
      const resolved = await response;
      expect(resolved.status).toBe(404);
      expect(await resolved.text()).toBe('<html>not found</html>');
      expect(fetchSpy).toHaveBeenCalledWith('/404');
    });

    it('serves the navigation when the flag is enabled', async () => {
      await updateConfig(beamAppEnabled, {
        development: { enabled: true },
      });
      fetchSpy.mockResolvedValue(
        new Response('<html>beam</html>', { status: 200 }),
      );

      const event = syntheticEvent(beamNavigation());
      handleFetch(event as unknown as FetchEvent);

      expect(event.respondWith).toHaveBeenCalledOnce();
      const [response] = event.respondWith.mock.calls[0] as [Promise<Response>];
      expect((await response).status).toBe(200);
    });

    it('gates the /beam/with/:endpoint peer route on the same flag', async () => {
      await updateConfig(beamAppEnabled, {
        development: { enabled: false },
      });
      fetchSpy.mockResolvedValue(
        new Response('<html>not found</html>', { status: 200 }),
      );

      const request = new Request(sameOrigin('/beam/with/abc123'));
      Object.defineProperty(request, 'mode', { value: 'navigate' });
      const event = syntheticEvent(request);
      handleFetch(event as unknown as FetchEvent);

      expect(event.respondWith).toHaveBeenCalledOnce();
      const [response] = event.respondWith.mock.calls[0] as [Promise<Response>];
      const resolved = await response;
      expect(resolved.status).toBe(404);
      expect(fetchSpy).toHaveBeenCalledWith('/404');
    });
  });
});
