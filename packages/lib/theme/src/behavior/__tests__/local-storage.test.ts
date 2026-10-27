import { removeItem, setItem, watchStorage } from '../local-storage';

// What another tab's write looks like from here.
const storageEvent = (init: StorageEventInit) =>
  dispatchEvent(
    new StorageEvent('storage', { storageArea: localStorage, ...init }),
  );

// A watch on `key` notifying a spy.
const setup = () => {
  const notify = vi.fn<(value: string) => void>();
  const stop = watchStorage('key', (stored) => `parsed:${stored}`, notify);

  return { notify, [Symbol.dispose]: stop };
};

describe('watchStorage', () => {
  it('passes on parsed writes to its key', () => {
    using watch = setup();

    storageEvent({ key: 'key', newValue: 'value' });

    expect(watch.notify).toHaveBeenCalledWith('parsed:value');
  });

  it('passes null when the key is removed', () => {
    using watch = setup();

    storageEvent({ key: 'key', newValue: null });

    expect(watch.notify).toHaveBeenCalledWith('parsed:null');
  });

  it('passes null when storage is cleared', () => {
    using watch = setup();

    storageEvent({ key: null });

    expect(watch.notify).toHaveBeenCalledWith('parsed:null');
  });

  it('ignores other keys and storage areas', () => {
    using watch = setup();

    storageEvent({ key: 'other', newValue: 'value' });
    storageEvent({
      key: 'key',
      newValue: 'value',
      storageArea: sessionStorage,
    });

    expect(watch.notify).not.toHaveBeenCalled();
  });

  it('stops watching when stopped', () => {
    let notify;
    {
      using watch = setup();
      notify = watch.notify;
    }

    storageEvent({ key: 'key', newValue: 'value' });
    expect(notify).not.toHaveBeenCalled();
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
