import { pipe } from '@lib/effects';
import { createTestController } from '@lib/effects/testing';
import { removeItem, setItem, watchStorage } from '../local-storage';

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

// Make one `Storage` method throw `error` until disposed.
const failing = (method: 'setItem' | 'removeItem', error: Error) =>
  vi.spyOn(Storage.prototype, method).mockImplementation(() => {
    throw error;
  });

describe('setItem', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores the value', () => {
    setItem('key', 'value');

    expect(localStorage.getItem('key')).toBe('value');
  });

  it('shrugs off storage that refuses access', () => {
    using spy = failing(
      'setItem',
      new DOMException('Blocked.', 'SecurityError'),
    );

    expect(() => setItem('key', 'value')).not.toThrow();
    expect(spy).toHaveBeenCalledWith('key', 'value');
  });

  it('rethrows anything else', () => {
    const error = new DOMException('Full.', 'QuotaExceededError');
    using spy = failing('setItem', error);

    expect(() => setItem('key', 'value')).toThrow(error);
    expect(spy).toHaveBeenCalledWith('key', 'value');
  });
});

describe('removeItem', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes the value', () => {
    localStorage.setItem('key', 'value');

    removeItem('key');

    expect(localStorage.getItem('key')).toBeNull();
  });

  it('shrugs off storage that refuses access', () => {
    using spy = failing(
      'removeItem',
      new DOMException('Blocked.', 'SecurityError'),
    );

    expect(() => removeItem('key')).not.toThrow();
    expect(spy).toHaveBeenCalledWith('key');
  });

  it('rethrows anything else', () => {
    const error = new Error('Broken.');
    using spy = failing('removeItem', error);

    expect(() => removeItem('key')).toThrow(error);
    expect(spy).toHaveBeenCalledWith('key');
  });
});
