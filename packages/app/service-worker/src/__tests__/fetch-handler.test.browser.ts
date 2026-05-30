/**
 * Behavioral tests for the SW's fetch dispatch + navigation
 * strategy. Cache Storage is real (provided by Chromium); only
 * `fetch` is stubbed so we can drive the network-success vs
 * network-error branches deterministically.
 */

import { CACHE_NAMES } from '../caches';
import {
  handleFetch,
  handleNavigation,
  type NavigationContext,
} from '../fetch-handler';

const sameOrigin = (path: string): string =>
  new URL(path, self.location.origin).toString();

/**
 * Builds a navigation context, defaulting the parts a given test
 * doesn't exercise: a no-op `waitUntil` and a preload that resolves to
 * nothing (so the handler falls back to `fetch`). Override either to
 * drive the preload / cache-refresh paths.
 */
const navContext = (
  request: Request,
  overrides: Partial<NavigationContext> = {},
): NavigationContext => ({
  request,
  waitUntil: () => {},
  preloadResponse: Promise.resolve(undefined),
  ...overrides,
});

const clearHtmlCache = async (): Promise<void> => {
  await caches.delete(CACHE_NAMES.html);
};

const flushWaitUntil = (promises: Array<Promise<unknown>>): Promise<unknown> =>
  Promise.all(promises);

beforeEach(async () => {
  await clearHtmlCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  // `vi.spyOn` (used to fake `navigator.onLine`) isn't covered by
  // `unstubAllGlobals` — without this, the offline branch sticks
  // around and bleeds into later tests.
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('handleNavigation', () => {
  it('returns the network response and refreshes the cache on success', async () => {
    const fresh = new Response('<html>fresh</html>', { status: 200 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fresh));
    const waitUntils: Array<Promise<unknown>> = [];

    const response = await handleNavigation(
      navContext(new Request(sameOrigin('/settings')), {
        waitUntil: (promise) => waitUntils.push(promise),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('<html>fresh</html>');

    await flushWaitUntil(waitUntils);
    const cache = await caches.open(CACHE_NAMES.html);
    const cached = await cache.match(sameOrigin('/settings'));
    expect(await cached?.text()).toBe('<html>fresh</html>');
  });

  it('does not cache non-OK responses', async () => {
    const notFound = new Response('missing', { status: 404 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(notFound));
    const waitUntils: Array<Promise<unknown>> = [];

    const response = await handleNavigation(
      navContext(new Request(sameOrigin('/missing')), {
        waitUntil: (promise) => waitUntils.push(promise),
      }),
    );

    expect(response.status).toBe(404);
    await flushWaitUntil(waitUntils);

    const cache = await caches.open(CACHE_NAMES.html);
    const cached = await cache.match(sameOrigin('/missing'));
    expect(cached).toBeUndefined();
  });

  it('falls back to the cache on network failure', async () => {
    const cache = await caches.open(CACHE_NAMES.html);
    await cache.put(
      new Request(sameOrigin('/settings')),
      new Response('<html>stale</html>', { status: 200 }),
    );
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Offline')));

    const response = await handleNavigation(
      navContext(new Request(sameOrigin('/settings'))),
    );

    expect(await response.text()).toBe('<html>stale</html>');
  });

  it('rejects when the network fails and the cache has no entry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Offline')));

    await expect(
      handleNavigation(navContext(new Request(sameOrigin('/never-visited')))),
    ).rejects.toThrow();
  });

  it('serves cached navigations without fetching when the UA reports offline', async () => {
    const cache = await caches.open(CACHE_NAMES.html);
    await cache.put(
      new Request(sameOrigin('/settings')),
      new Response('<html>stale</html>', { status: 200 }),
    );
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.spyOn(self.navigator, 'onLine', 'get').mockReturnValue(false);

    // A rejecting preload stands in for the doomed request the browser
    // kicks off while offline.
    const response = await handleNavigation(
      navContext(new Request(sameOrigin('/settings')), {
        preloadResponse: Promise.reject(new TypeError('Offline')),
      }),
    );

    expect(await response.text()).toBe('<html>stale</html>');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('re-throws without fetching when the UA reports offline and the cache is empty', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.spyOn(self.navigator, 'onLine', 'get').mockReturnValue(false);

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
    vi.useFakeTimers();
    const cache = await caches.open(CACHE_NAMES.html);
    await cache.put(
      new Request(sameOrigin('/settings')),
      new Response('<html>stale</html>', { status: 200 }),
    );

    // A fetch that never settles — just needs to outlast the timeout.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise<Response>(() => {})),
    );

    const responsePromise = handleNavigation(
      navContext(new Request(sameOrigin('/settings'))),
    );

    await vi.advanceTimersByTimeAsync(1500);

    const response = await responsePromise;
    expect(await response.text()).toBe('<html>stale</html>');
  });

  it('serves the navigation-preload response without issuing its own fetch', async () => {
    const preloaded = new Response('<html>preloaded</html>', { status: 200 });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const waitUntils: Array<Promise<unknown>> = [];

    const response = await handleNavigation(
      navContext(new Request(sameOrigin('/settings')), {
        waitUntil: (promise) => waitUntils.push(promise),
        preloadResponse: Promise.resolve(preloaded),
      }),
    );

    expect(await response.text()).toBe('<html>preloaded</html>');
    expect(fetchSpy).not.toHaveBeenCalled();

    // The preload response refreshes the cache just like a fetch win.
    await flushWaitUntil(waitUntils);
    const cache = await caches.open(CACHE_NAMES.html);
    const cached = await cache.match(sameOrigin('/settings'));
    expect(await cached?.text()).toBe('<html>preloaded</html>');
  });

  it('falls back to fetch when no preload ran for the navigation', async () => {
    const fresh = new Response('<html>fresh</html>', { status: 200 });
    const fetchSpy = vi.fn().mockResolvedValue(fresh);
    vi.stubGlobal('fetch', fetchSpy);

    const response = await handleNavigation(
      // `navContext` defaults `preloadResponse` to resolve `undefined`.
      navContext(new Request(sameOrigin('/settings'))),
    );

    expect(await response.text()).toBe('<html>fresh</html>');
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});

interface SyntheticFetchEvent {
  request: Request;
  respondWith: ReturnType<typeof vi.fn>;
  waitUntil: ReturnType<typeof vi.fn>;
  preloadResponse: Promise<Response | undefined>;
}

const syntheticEvent = (request: Request): SyntheticFetchEvent => ({
  request,
  respondWith: vi.fn(),
  waitUntil: vi.fn(),
  preloadResponse: Promise.resolve(undefined),
});

describe('handleFetch', () => {
  it('ignores cross-origin requests', () => {
    const event = syntheticEvent(new Request('https://other.example/page'));
    handleFetch(event as unknown as FetchEvent);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it('short-circuits the local health check with a JSON status', async () => {
    const event = syntheticEvent(new Request(sameOrigin('/api/local/health')));
    handleFetch(event as unknown as FetchEvent);

    expect(event.respondWith).toHaveBeenCalledTimes(1);
    const [arg] = event.respondWith.mock.calls[0] as [Response];
    expect(arg).toBeInstanceOf(Response);
    expect(await arg.json()).toEqual({ status: 'online' });
  });

  it('claims GET navigations so they flow through the offline strategy', () => {
    // `mode: 'navigate'` is reserved for the browser — the `Request`
    // constructor refuses it. Override the getter post-hoc so the
    // dispatch logic sees the same shape a real navigation has.
    const request = new Request(sameOrigin('/icon-editor'));
    Object.defineProperty(request, 'mode', { value: 'navigate' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html/>', { status: 200 })),
    );

    const event = syntheticEvent(request);
    handleFetch(event as unknown as FetchEvent);
    expect(event.respondWith).toHaveBeenCalledTimes(1);
  });

  it('ignores non-navigation same-origin requests', () => {
    const event = syntheticEvent(
      new Request(sameOrigin('/_build/asset.js'), { mode: 'cors' }),
    );
    handleFetch(event as unknown as FetchEvent);
    expect(event.respondWith).not.toHaveBeenCalled();
  });
});
