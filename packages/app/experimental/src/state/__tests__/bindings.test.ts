import { createTestBindings } from '@lib/state';
import { read } from '@lib/runtime-config';
import type * as RuntimeConfig from '@lib/runtime-config';
import type * as Observability from '@lib/observability';
import { loadExperimentalFlagEffect } from '../bindings';
import { experimentalFlagStore } from '../store';

// Keep the option's real `defineOption` (the store seeds from its defaults);
// stub only the async override read so each test drives the resolved value.
vi.mock('@lib/runtime-config', async (importOriginal) => ({
  ...(await importOriginal<typeof RuntimeConfig>()),
  read: vi.fn(),
}));

// The failure binding logs through observability; silence it so the
// "keeps default" test stays hermetic.
vi.mock('@lib/observability', async (importOriginal) => ({
  ...(await importOriginal<typeof Observability>()),
  createLogger: () => ({ error: vi.fn() }),
}));

const setup = () => {
  const bindings = createTestBindings();
  return { ...bindings, flag: bindings.createStore(experimentalFlagStore) };
};

beforeEach(() => {
  vi.mocked(read).mockReset();
});

describe('experimental flag', () => {
  it('seeds enabled from the option default for the active environment', () => {
    const { flag } = setup();

    // The placeholder environment is `dev`, whose default is enabled.
    expect(flag.enabled).toBe(true);
  });

  it('applies a persisted override that disables the active environment', async () => {
    vi.mocked(read).mockResolvedValue({
      dev: { enabled: false },
      staging: { enabled: true },
      prod: { enabled: false },
    });
    const { flag, useEffect } = setup();

    await useEffect(loadExperimentalFlagEffect)();

    expect(flag.enabled).toBe(false);
  });

  it('keeps the seeded default when the override read fails', async () => {
    vi.mocked(read).mockRejectedValue(new Error('opfs unavailable'));
    const { flag, useEffect } = setup();

    await useEffect(loadExperimentalFlagEffect)();

    expect(flag.enabled).toBe(true);
  });
});
