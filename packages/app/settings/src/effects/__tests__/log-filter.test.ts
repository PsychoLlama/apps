import { createTestController } from '@lib/effects/testing';
import { readEnvironment, subscribe } from '@lib/runtime-config';
import type * as RuntimeConfig from '@lib/runtime-config';
import { filter } from '@lib/observability/config';
import { observeLogFilter, readLogFilter } from '../log-filter';

vi.mock('@lib/runtime-config', async (importOriginal) => ({
  ...(await importOriginal<typeof RuntimeConfig>()),
  readEnvironment: vi.fn(),
  subscribe: vi.fn(),
}));

type Listener = (value: { pattern: string }) => void;

/** Captures the subscription so tests can push changes through it. */
const setup = () => {
  const unsubscribe = vi.fn();
  let listener: Listener | undefined;

  vi.mocked(subscribe).mockImplementation((option, callback) => {
    expect(option).toBe(filter);
    listener = callback;
    return unsubscribe;
  });

  const push = (pattern: string) => {
    expect(listener).toBeDefined();
    listener?.({ pattern });
  };

  return { push, unsubscribe };
};

beforeEach(() => {
  vi.mocked(readEnvironment).mockReset();
  vi.mocked(subscribe).mockReset();
});

describe('readLogFilter', () => {
  it('resolves the pattern for the active environment', async () => {
    vi.mocked(readEnvironment).mockResolvedValue({ pattern: 'app:*' });
    await using effects = createTestController();

    const [pattern] = await effects.run(readLogFilter);

    expect(pattern).toBe('app:*');
    expect(readEnvironment).toHaveBeenCalledWith(filter);
  });
});

describe('observeLogFilter', () => {
  it('starts from the persisted pattern', async () => {
    setup();
    vi.mocked(readEnvironment).mockResolvedValue({ pattern: 'app:*' });
    await using effects = createTestController();

    const [pattern] = await effects.run(observeLogFilter);

    expect(pattern()).toBe('app:*');
  });

  it('follows later changes', async () => {
    const { push } = setup();
    vi.mocked(readEnvironment).mockResolvedValue({ pattern: 'app:*' });
    await using effects = createTestController();

    const [pattern] = await effects.run(observeLogFilter);
    push('*');

    expect(pattern()).toBe('*');
  });

  it('shares the read with readLogFilter', async () => {
    setup();
    vi.mocked(readEnvironment).mockResolvedValue({ pattern: 'app:*' });
    await using effects = createTestController();

    await effects.run(readLogFilter);
    await effects.run(observeLogFilter);

    expect(readEnvironment).toHaveBeenCalledOnce();
  });

  it('unsubscribes when released', async () => {
    const { unsubscribe } = setup();
    vi.mocked(readEnvironment).mockResolvedValue({ pattern: 'app:*' });
    const effects = createTestController();

    await effects.run(observeLogFilter);
    expect(unsubscribe).not.toHaveBeenCalled();

    await effects[Symbol.asyncDispose]();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('never subscribes if the read fails', async () => {
    setup();
    vi.mocked(readEnvironment).mockRejectedValue(new Error('No OPFS.'));
    await using effects = createTestController();

    await expect(effects.run(observeLogFilter)).rejects.toThrow();
    expect(subscribe).not.toHaveBeenCalled();
  });
});
