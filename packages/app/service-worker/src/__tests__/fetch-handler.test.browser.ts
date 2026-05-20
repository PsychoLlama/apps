/**
 * Behavioral tests for the SW's fetch dispatch + navigation
 * strategy. Cache Storage is real (provided by Chromium); only
 * `fetch` is stubbed so we can drive the network-success vs
 * network-error branches deterministically.
 */

import { CACHE_NAMES } from '../caches';
import { handleFetch, handleNavigation } from '../fetch-handler';

const sameOrigin = (path: string): string =>
  new URL(path, self.location.origin).toString();

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
});

describe('handleNavigation', () => {
  it('returns the network response and refreshes the cache on success', async () => {
    const fresh = new Response('<html>fresh</html>', { status: 200 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fresh));
    const waitUntils: Array<Promise<unknown>> = [];

    const response = await handleNavigation({
      request: new Request(sameOrigin('/settings')),
      waitUntil: (promise) => waitUntils.push(promise),
    });

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

    const response = await handleNavigation({
      request: new Request(sameOrigin('/missing')),
      waitUntil: (promise) => waitUntils.push(promise),
    });

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

    const response = await handleNavigation({
      request: new Request(sameOrigin('/settings')),
      waitUntil: () => {},
    });

    expect(await response.text()).toBe('<html>stale</html>');
  });

  it('re-throws when offline and the cache has no entry', async () => {
    const offline = new TypeError('Offline');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(offline));

    await expect(
      handleNavigation({
        request: new Request(sameOrigin('/never-visited')),
        waitUntil: () => {},
      }),
    ).rejects.toBe(offline);
  });
});

interface SyntheticFetchEvent {
  request: Request;
  respondWith: ReturnType<typeof vi.fn>;
  waitUntil: ReturnType<typeof vi.fn>;
}

const syntheticEvent = (request: Request): SyntheticFetchEvent => ({
  request,
  respondWith: vi.fn(),
  waitUntil: vi.fn(),
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
