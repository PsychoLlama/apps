import { pipe } from '@lib/effects';
import { applyColorScheme, readActiveColorScheme } from '../capabilities';
import { observeAttribute } from './observe-attribute';

/**
 * The active color-scheme option as a live accessor, read off
 * `<html data-color-scheme>`. The DOM is the canonical record: the
 * prelude stamps it before paint, and every change writes it first.
 * Client-only; it reads `document`.
 */
export const $colorScheme = pipe([
  () => observeAttribute('data-color-scheme', readActiveColorScheme),
]);

/**
 * Switch the color-scheme override, or hand control back to the system
 * with `'system'`. Persists the choice for the prelude to restore. The
 * write echoes back through `$colorScheme`.
 */
export const $selectColorScheme = pipe([() => applyColorScheme]);
