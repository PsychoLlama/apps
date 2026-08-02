/**
 * Tests for `watchAdvancedSettings` — the bridge from three
 * `@lib/runtime-config` subscriptions to one async stream. The rest of the
 * capabilities are thin wrappers over `@lib/runtime-config` and are
 * covered there.
 */

import { subscribe } from '@lib/runtime-config';
import type * as RuntimeConfig from '@lib/runtime-config';
import { filter } from '@lib/observability/config';
import { logExport } from '@app/logs/config';
import { enabled as scratchpadAppEnabled } from '@app/scratchpad/config';
import {
  watchAdvancedSettings,
  type AdvancedSettingChange,
} from '../capabilities';

vi.mock('@lib/runtime-config', async (importOriginal) => ({
  ...(await importOriginal<typeof RuntimeConfig>()),
  subscribe: vi.fn(),
}));

/** The listener each option's subscription was registered with. */
type Listeners = {
  logFilter: (value: { pattern: string }) => void;
  logExport: (value: { enabled: boolean }) => void;
  scratchpad: (value: { enabled: boolean }) => void;
};

const setup = () => {
  const unsubscribes = [vi.fn(), vi.fn(), vi.fn()];
  const listeners: Partial<Listeners> = {};
  let index = 0;

  vi.mocked(subscribe).mockImplementation((option, listener) => {
    if (option === filter) listeners.logFilter = listener;
    if (option === logExport) listeners.logExport = listener;
    if (option === scratchpadAppEnabled) listeners.scratchpad = listener;
    return unsubscribes[index++] ?? vi.fn();
  });

  const controller = new AbortController();
  const changes = watchAdvancedSettings(controller.signal);

  return {
    changes,
    controller,
    unsubscribes,
    listeners: listeners as Listeners,
  };
};

beforeEach(() => {
  vi.mocked(subscribe).mockReset();
});

describe('watchAdvancedSettings', () => {
  it('subscribes to every option up front, before anything drains it', () => {
    const { listeners } = setup();

    expect(subscribe).toHaveBeenCalledTimes(3);
    expect(Object.keys(listeners).sort()).toEqual([
      'logExport',
      'logFilter',
      'scratchpad',
    ]);
  });

  it('reports each option under its own tag', async () => {
    const { changes, listeners } = setup();

    listeners.logFilter({ pattern: 'app:*' });
    listeners.logExport({ enabled: true });
    listeners.scratchpad({ enabled: false });

    const seen: AdvancedSettingChange[] = [];
    for await (const change of changes) {
      seen.push(change);
      if (seen.length === 3) break;
    }

    expect(seen).toEqual([
      { option: 'logFilter', pattern: 'app:*' },
      { option: 'logExport', enabled: true },
      { option: 'scratchpad', enabled: false },
    ]);
  });

  it('buffers a burst rather than collapsing it to the last change', async () => {
    const { changes, listeners } = setup();
    const seen: AdvancedSettingChange[] = [];

    // Drain concurrently so the consumer is parked on an empty queue when
    // the burst lands — the case where dropping instead of buffering
    // would lose everything but the final change.
    const draining = (async () => {
      for await (const change of changes) {
        seen.push(change);
        if (seen.length === 3) break;
      }
    })();

    listeners.logFilter({ pattern: 'a' });
    listeners.logFilter({ pattern: 'b' });
    listeners.logFilter({ pattern: 'c' });
    await draining;

    expect(seen).toEqual([
      { option: 'logFilter', pattern: 'a' },
      { option: 'logFilter', pattern: 'b' },
      { option: 'logFilter', pattern: 'c' },
    ]);
  });

  it('ends and unsubscribes when the signal aborts', async () => {
    const { changes, controller, unsubscribes } = setup();
    const seen: AdvancedSettingChange[] = [];

    const draining = (async () => {
      for await (const change of changes) seen.push(change);
    })();

    controller.abort();
    await draining;

    expect(seen).toEqual([]);
    for (const unsubscribe of unsubscribes) {
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    }
  });

  it('unsubscribes when the consumer stops draining early', async () => {
    const { changes, listeners, unsubscribes } = setup();
    listeners.scratchpad({ enabled: true });

    for await (const change of changes) {
      expect(change).toEqual({ option: 'scratchpad', enabled: true });
      break;
    }

    for (const unsubscribe of unsubscribes) {
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    }
  });
});
