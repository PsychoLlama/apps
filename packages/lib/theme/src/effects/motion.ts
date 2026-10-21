import { pipe } from '@lib/effects';
import { applyMotion, readActiveMotion } from '../capabilities';
import { observeAttribute } from './observe-attribute';

/**
 * The active motion option as a live accessor, read off
 * `<html data-reduced-motion>`. The DOM is the canonical record: the
 * prelude stamps it before paint, and every change writes it first.
 * Client-only; it reads `document`.
 */
export const $motion = pipe([
  () => observeAttribute('data-reduced-motion', readActiveMotion),
]);

/**
 * Switch the motion override, or hand control back to the system with
 * `'system'`. Persists the choice for the prelude to restore. The write
 * echoes back through `$motion`.
 */
export const $selectMotion = pipe([() => applyMotion]);
