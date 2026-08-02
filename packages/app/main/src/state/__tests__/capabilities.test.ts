/**
 * Tests for `watchLauncherFlags` — the bridge from the gated apps'
 * `@lib/runtime-config` subscriptions to one async stream. The buffering
 * and teardown belong to `watchAll` and are covered there; what's under
 * test here is that each option lands under its own tag.
 *
 * `readLauncherFlags` is a thin wrapper over `@lib/runtime-config` and is
 * covered there.
 */

import { subscribe } from '@lib/runtime-config';
import type * as RuntimeConfig from '@lib/runtime-config';
import { enabled as scratchpadAppEnabled } from '@app/scratchpad/config';
import { watchLauncherFlags, type LauncherFlagChange } from '../capabilities';

vi.mock('@lib/runtime-config', async (importOriginal) => ({
  ...(await importOriginal<typeof RuntimeConfig>()),
  subscribe: vi.fn(),
}));

/** The listener each option's subscription was registered with. */
interface Listeners {
  scratchpad: (value: { enabled: boolean }) => void;
}

const setup = () => {
  const listeners: Partial<Listeners> = {};

  vi.mocked(subscribe).mockImplementation((option, listener) => {
    if (option === scratchpadAppEnabled) listeners.scratchpad = listener;
    return vi.fn();
  });

  const controller = new AbortController();
  const changes = watchLauncherFlags(controller.signal);

  return { changes, controller, listeners: listeners as Listeners };
};

beforeEach(() => {
  vi.mocked(subscribe).mockReset();
});

describe('watchLauncherFlags', () => {
  it('subscribes to every option up front, before anything drains it', () => {
    const { listeners } = setup();

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(Object.keys(listeners).sort()).toEqual(['scratchpad']);
  });

  it('reports each app under its own tag', async () => {
    const { changes, listeners } = setup();

    listeners.scratchpad({ enabled: false });

    const seen: LauncherFlagChange[] = [];
    for await (const change of changes) {
      seen.push(change);
      break;
    }

    expect(seen).toEqual([{ app: 'scratchpad', enabled: false }]);
  });
});
