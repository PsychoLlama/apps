import { createSignal } from 'solid-js';
import { pipe, reactive, type Reactive } from '@lib/effects';
import { applyMotion, readActiveMotion } from '../capabilities';
import type { MotionOption } from '../constants';

// Only the attribute: every write lands there, even when localStorage
// rejects it.
const observeMotion = (): Reactive<MotionOption, 'sync'> => {
  const [motion, setMotion] = createSignal(readActiveMotion());
  const observer = new MutationObserver(() => setMotion(readActiveMotion()));

  observer.observe(document.documentElement, {
    attributeFilter: ['data-reduced-motion'],
  });

  return reactive(motion, () => observer.disconnect());
};

/**
 * The active motion option as a live accessor, read off
 * `<html data-reduced-motion>`. The DOM is the canonical record: the
 * prelude stamps it before paint, and every change writes it first.
 * Client-only; it reads `document`.
 */
export const $motion = pipe([() => observeMotion()]);

/**
 * Switch the motion override, or hand control back to the system with
 * `'system'`. Persists the choice for the prelude to restore. The write
 * echoes back through `$motion`.
 */
export const $selectMotion = pipe([() => applyMotion]);
