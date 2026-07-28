/**
 * Tests for the export gate's capabilities: resolving both conditions
 * together, and merging their two very different change sources — a
 * runtime-config subscription and the browser's `controllerchange` event —
 * into one stream. The buffering and teardown belong to `watchAll` and are
 * covered there; what's under test here is that each source lands under its
 * own tag, and that a missing Service Worker API is survivable.
 */

import { readEnvironment, subscribe } from '@lib/runtime-config';
import type * as RuntimeConfig from '@lib/runtime-config';
import {
  readExportGate,
  watchExportGate,
  type ExportGateChange,
} from '../capabilities';

vi.mock('@lib/runtime-config', async (importOriginal) => ({
  ...(await importOriginal<typeof RuntimeConfig>()),
  readEnvironment: vi.fn(),
  subscribe: vi.fn(),
}));

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

/** Open the stream, returning it alongside the flag listener it registered. */
const watching = () => {
  let onFlagChange!: (value: { enabled: boolean }) => void;
  vi.mocked(subscribe).mockImplementation((_option, listener) => {
    onFlagChange = listener;
    return vi.fn();
  });

  const controller = new AbortController();
  return { changes: watchExportGate(controller.signal), onFlagChange };
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(subscribe).mockReset();
});

describe('readExportGate', () => {
  it('resolves the flag and the page controller together', async () => {
    vi.mocked(readEnvironment).mockResolvedValue({ enabled: true });
    stubServiceWorker({});

    await expect(readExportGate()).resolves.toEqual({
      enabled: true,
      controlled: true,
    });
  });

  it('reports no control where the Service Worker API is missing', async () => {
    vi.mocked(readEnvironment).mockResolvedValue({ enabled: true });
    vi.stubGlobal('navigator', {});

    // Unsupported browsers and private windows that disable it land here, as
    // does SSG. The export route would escape to the network and 404.
    await expect(readExportGate()).resolves.toEqual({
      enabled: true,
      controlled: false,
    });
  });
});

describe('watchExportGate', () => {
  it('subscribes to both sources up front, before anything drains it', () => {
    const container = stubServiceWorker(null);
    watching();

    expect(subscribe).toHaveBeenCalledTimes(1);

    // A handoff before the first pull is buffered rather than dropped, which
    // is what lets the saga subscribe, read, and drain in that order.
    expect(() => handOffControl(container)).not.toThrow();
  });

  it('reports each condition under its own tag', async () => {
    const container = stubServiceWorker(null);
    const { changes, onFlagChange } = watching();

    onFlagChange({ enabled: true });
    handOffControl(container);

    const seen: ExportGateChange[] = [];
    for await (const change of changes) {
      seen.push(change);
      if (seen.length === 2) break;
    }

    expect(seen).toEqual([
      { source: 'flag', enabled: true },
      { source: 'worker', controlled: true },
    ]);
  });

  it('still reports flag changes with no Service Worker API', async () => {
    vi.stubGlobal('navigator', {});
    const { changes, onFlagChange } = watching();

    onFlagChange({ enabled: false });

    // Half the gate simply never reports; the other half has to keep working.
    for await (const change of changes) {
      expect(change).toEqual({ source: 'flag', enabled: false });
      break;
    }
  });
});
