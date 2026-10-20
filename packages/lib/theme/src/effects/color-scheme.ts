import { createSignal } from 'solid-js';
import { pipe, reactive, type Reactive } from '@lib/effects';
import { applyColorScheme, readActiveColorScheme } from '../capabilities';
import type { ColorSchemeOption } from '../constants';

// Only the attribute: every write lands there, even when localStorage
// rejects it.
const observeColorScheme = (): Reactive<ColorSchemeOption, 'sync'> => {
  const [colorScheme, setColorScheme] = createSignal(readActiveColorScheme());
  const observer = new MutationObserver(() =>
    setColorScheme(readActiveColorScheme()),
  );

  observer.observe(document.documentElement, {
    attributeFilter: ['data-color-scheme'],
  });

  return reactive(colorScheme, () => observer.disconnect());
};

/**
 * The active color-scheme option as a live accessor, read off
 * `<html data-color-scheme>`. The DOM is the canonical record: the
 * prelude stamps it before paint, and every change writes it first.
 * Client-only; it reads `document`.
 */
export const $colorScheme = pipe([() => observeColorScheme()]);

/**
 * Switch the color-scheme override, or hand control back to the system
 * with `'system'`. Persists the choice for the prelude to restore. The
 * write echoes back through `$colorScheme`.
 */
export const $selectColorScheme = pipe([() => applyColorScheme]);
