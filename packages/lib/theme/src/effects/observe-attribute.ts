import { createSignal } from 'solid-js';
import { reactive, type Reactive } from '@lib/effects';

/**
 * Follow an attribute on `<html>` as a live accessor, re-reading `read`
 * whenever it changes. Watches only the attribute: every write lands
 * there, even when localStorage rejects it. Releasing it disconnects the
 * observer.
 */
export const observeAttribute = <T>(
  attribute: string,
  read: () => T,
): Reactive<T, 'sync'> => {
  const [value, setValue] = createSignal(read());
  const observer = new MutationObserver(() => setValue(() => read()));

  observer.observe(document.documentElement, {
    attributeFilter: [attribute],
  });

  return reactive(value, () => observer.disconnect());
};
