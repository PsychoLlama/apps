import { resource } from '@lib/effects';

/**
 * A plan step following what other tabs store under `key`. Each write
 * goes through `parse` and on to whatever publisher the earlier step
 * yields, e.g. `pipe([$changed, watchStorage(key, parse)])`. A cleared
 * store reads as `null`. `storage` events never fire in the tab that
 * wrote the value.
 *
 * @internal
 */
export const watchStorage =
  <T>(key: string, parse: (stored: string | null) => T) =>
  (publish: (value: T) => void) => {
    const notify = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) return;

      // A `null` key means storage was cleared.
      if (event.key === key || event.key === null) {
        publish(parse(event.newValue));
      }
    };

    addEventListener('storage', notify);

    return resource(undefined, () => removeEventListener('storage', notify));
  };
