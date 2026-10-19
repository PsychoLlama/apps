import { createTestController } from '@lib/effects/testing';
import { readEnvironment, subscribe } from '@lib/runtime-config';
import type * as RuntimeConfig from '@lib/runtime-config';
import { filter } from '@lib/observability/config';
import { observeLogFilter } from '../log-filter';

vi.mock('@lib/runtime-config', async (importOriginal) => ({
  ...(await importOriginal<typeof RuntimeConfig>()),
  readEnvironment: vi.fn(),
  subscribe: vi.fn(),
}));

type Listener = (value: { pattern: string }) => void;

/**
 * Tracks live subscriptions so tests can push changes through them and
 * check that none outlive the flow.
 */
const setup = () => {
  const listeners = new Set<Listener>();

  vi.mocked(subscribe).mockImplementation((option, callback) => {
    expect(option).toBe(filter);
    const listener: Listener = (value) => callback(value);
    listeners.add(listener);
    return () => listeners.delete(listener);
  });

  const push = (pattern: string) => {
    expect(listeners.size).toBeGreaterThan(0);
    for (const listener of listeners) listener({ pattern });
  };

  return { push, listeners };
};

beforeEach(() => {
  vi.mocked(readEnvironment).mockReset();
  vi.mocked(subscribe).mockReset();
});

describe('observeLogFilter', () => {
  it('starts from the persisted pattern', async () => {
    setup();
    vi.mocked(readEnvironment).mockResolvedValue({ pattern: 'app:*' });
    await using effects = createTestController();

    const [pattern] = await effects.run(observeLogFilter);

    expect(pattern()).toBe('app:*');
    expect(readEnvironment).toHaveBeenCalledWith(filter);
  });

  it('follows later changes', async () => {
    const { push } = setup();
    vi.mocked(readEnvironment).mockResolvedValue({ pattern: 'app:*' });
    await using effects = createTestController();

    const [pattern] = await effects.run(observeLogFilter);
    push('*');

    expect(pattern()).toBe('*');
  });

  it('keeps a change that lands mid-read', async () => {
    const { push } = setup();
    vi.mocked(readEnvironment).mockImplementation(async () => {
      push('*');
      return { pattern: 'app:*' };
    });
    await using effects = createTestController();

    const [pattern] = await effects.run(observeLogFilter);

    expect(pattern()).toBe('*');
  });

  it('unsubscribes when released', async () => {
    const { listeners } = setup();
    vi.mocked(readEnvironment).mockResolvedValue({ pattern: 'app:*' });
    const effects = createTestController();

    await effects.run(observeLogFilter);
    expect(listeners.size).toBe(1);

    await effects[Symbol.asyncDispose]();
    expect(listeners.size).toBe(0);
  });

  it('unsubscribes if the read fails', async () => {
    const { listeners } = setup();
    vi.mocked(readEnvironment).mockRejectedValue(new Error('No OPFS.'));
    await using effects = createTestController();

    await expect(effects.run(observeLogFilter)).rejects.toThrow();
    expect(listeners.size).toBe(0);
  });
});
