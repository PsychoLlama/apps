import { pipe } from '@lib/effects';
import { createTestController } from '@lib/effects/testing';
import { watchStorage } from '../local-storage';

// What another tab's write looks like from here.
const storageEvent = (init: StorageEventInit) =>
  dispatchEvent(
    new StorageEvent('storage', { storageArea: localStorage, ...init }),
  );

// A watch on `key` publishing to a spy.
const setup = () => {
  const publish = vi.fn<(value: string) => void>();
  const $watch = pipe([
    () => publish,
    watchStorage('key', (stored) => `parsed:${stored}`),
  ]);

  return { publish, $watch };
};

describe('watchStorage', () => {
  it('publishes parsed writes to its key', async () => {
    const { publish, $watch } = setup();
    await using effects = createTestController();
    await effects.run($watch);

    storageEvent({ key: 'key', newValue: 'value' });

    expect(publish).toHaveBeenCalledWith('parsed:value');
  });

  it('publishes null when the key is removed', async () => {
    const { publish, $watch } = setup();
    await using effects = createTestController();
    await effects.run($watch);

    storageEvent({ key: 'key', newValue: null });

    expect(publish).toHaveBeenCalledWith('parsed:null');
  });

  it('publishes null when storage is cleared', async () => {
    const { publish, $watch } = setup();
    await using effects = createTestController();
    await effects.run($watch);

    storageEvent({ key: null });

    expect(publish).toHaveBeenCalledWith('parsed:null');
  });

  it('ignores other keys and storage areas', async () => {
    const { publish, $watch } = setup();
    await using effects = createTestController();
    await effects.run($watch);

    storageEvent({ key: 'other', newValue: 'value' });
    storageEvent({
      key: 'key',
      newValue: 'value',
      storageArea: sessionStorage,
    });

    expect(publish).not.toHaveBeenCalled();
  });

  it('stops watching when released', async () => {
    const { publish, $watch } = setup();

    {
      await using effects = createTestController();
      await effects.run($watch);
    }

    storageEvent({ key: 'key', newValue: 'value' });
    expect(publish).not.toHaveBeenCalled();
  });
});
