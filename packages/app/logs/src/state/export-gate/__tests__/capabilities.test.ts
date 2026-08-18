/**
 * Tests for the export gate's capabilities: reading who controls the page, and
 * turning the browser's `controllerchange` event into a stream. The buffering
 * and teardown belong to `watchAll` and are covered there; what's under test
 * here is that a handoff is reported, and that a missing Service Worker API is
 * survivable.
 */

import { isWorkerControlling, watchWorkerControl } from '../capabilities';

/** A stand-in `ServiceWorkerContainer`: an event target with a controller. */
interface FakeContainer extends EventTarget {
  controller: object | null;
}

/**
 * Put a service-worker container (or nothing at all) behind `navigator`.
 * jsdom implements neither the container nor the event, and "no Service Worker
 * API" is itself a case the gate has to survive.
 */
const stubServiceWorker = (controller: object | null): FakeContainer => {
  const container = Object.assign(new EventTarget(), { controller });
  vi.stubGlobal('navigator', { serviceWorker: container });
  return container;
};

/** Hand the container over to a newly activated worker. */
const handOffControl = (container: FakeContainer): void => {
  container.controller = {};
  container.dispatchEvent(new Event('controllerchange'));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isWorkerControlling', () => {
  it('reports the page controller', () => {
    stubServiceWorker({});

    expect(isWorkerControlling()).toBe(true);
  });

  it('reports no control where the Service Worker API is missing', () => {
    vi.stubGlobal('navigator', {});

    // Unsupported browsers and private windows that disable it land here, as
    // does SSG. The export route would escape to the network and 404.
    expect(isWorkerControlling()).toBe(false);
  });
});

describe('watchWorkerControl', () => {
  it('subscribes up front, before anything drains it', async () => {
    const container = stubServiceWorker(null);
    const controller = new AbortController();
    const changes = watchWorkerControl(controller.signal);

    // A handoff before the first pull is buffered rather than dropped, which
    // is what lets the saga subscribe, read, and drain in that order.
    handOffControl(container);

    for await (const change of changes) {
      expect(change).toBe(true);
      break;
    }
  });

  it('survives a missing Service Worker API', async () => {
    vi.stubGlobal('navigator', {});
    const controller = new AbortController();
    const changes = watchWorkerControl(controller.signal);
    const seen: boolean[] = [];

    const draining = (async () => {
      for await (const change of changes) seen.push(change);
    })();

    // Nothing can ever report, so the stream only ends when the scope does.
    controller.abort();
    await draining;

    expect(seen).toEqual([]);
  });
});
