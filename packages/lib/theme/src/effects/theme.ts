import { createSignal } from 'solid-js';
import { pipe, reactive, type Reactive } from '@lib/effects';
import { applyTheme, readActiveTheme, resetTheme } from '../capabilities';
import type { ThemeId } from '../constants';

// Only the attribute: every write lands there, even when localStorage
// rejects it.
const observeTheme = (): Reactive<ThemeId, 'sync'> => {
  const [theme, setTheme] = createSignal(readActiveTheme());
  const observer = new MutationObserver(() => setTheme(readActiveTheme()));

  observer.observe(document.documentElement, {
    attributeFilter: ['data-theme'],
  });

  return reactive(theme, () => observer.disconnect());
};

/**
 * The active theme as a live accessor, read off `<html data-theme>`. The
 * DOM is the canonical record: the prelude stamps it before paint, and
 * every change writes it first. Client-only; it reads `document`.
 */
export const $theme = pipe([observeTheme]);

/**
 * Switch the theme and persist the choice for the prelude to restore.
 * The write echoes back through `$theme`.
 */
export const $selectTheme = pipe([() => applyTheme]);

/**
 * Forget the persisted theme and restore the default. Unlike selecting
 * the default, the next load follows whatever default ships. The write
 * echoes back through `$theme`.
 */
export const $resetTheme = pipe([() => resetTheme]);
