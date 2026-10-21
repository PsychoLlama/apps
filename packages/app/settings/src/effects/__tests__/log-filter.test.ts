import { reactive } from '@lib/effects';
import { createTestController } from '@lib/effects/testing';
import { environment, reset, updateConfig } from '@lib/runtime-config';
import type * as RuntimeConfig from '@lib/runtime-config';
import { observeOption } from '@lib/runtime-config/effects';
import { filter } from '@lib/observability/config';
import { $logFilter, $resetFilter, $updateFilter } from '../log-filter';

vi.mock('@lib/runtime-config', async (importOriginal) => ({
  ...(await importOriginal<typeof RuntimeConfig>()),
  reset: vi.fn(),
  updateConfig: vi.fn(),
}));

// Subscribe-then-read is `observeOption`'s to test. Here it only matters
// that the plan observes the right option and hands the resource through.
vi.mock('@lib/runtime-config/effects', () => ({
  observeOption: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(observeOption).mockReset();
  vi.mocked(reset).mockReset();
  vi.mocked(updateConfig).mockReset();
});

describe('$logFilter', () => {
  it('observes the log filter option', async () => {
    const unsubscribe = vi.fn();
    vi.mocked(observeOption).mockResolvedValue(
      reactive(() => ({ pattern: 'app:*' }), unsubscribe),
    );
    const effects = createTestController();

    const logFilter = await effects.run($logFilter);

    expect(logFilter()).toEqual({ pattern: 'app:*' });
    expect(observeOption).toHaveBeenCalledWith(filter);

    await effects[Symbol.asyncDispose]();
    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe('$updateFilter', () => {
  it("overrides the active environment's pattern", async () => {
    await using effects = createTestController();

    const updateFilter = await effects.run($updateFilter);
    await updateFilter('app:*');

    expect(updateConfig).toHaveBeenCalledWith(filter, {
      [environment]: { pattern: 'app:*' },
    });
  });
});

describe('$resetFilter', () => {
  it("clears only the active environment's override", async () => {
    await using effects = createTestController();

    const resetFilter = await effects.run($resetFilter);
    await resetFilter();

    expect(reset).toHaveBeenCalledWith(filter, [environment]);
  });
});
