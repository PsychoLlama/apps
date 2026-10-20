import { defineScope } from '@lib/state';

/**
 * Owns the runtime view of the theme and motion preferences. Anchored by
 * whatever surface displays or changes them — the settings page, for its
 * lifetime.
 *
 * Nothing is lost when the last anchor releases. The DOM attributes the
 * prelude stamps onto `<html>` are the canonical record; this scope holds
 * a mirror of them, and every consumer re-hydrates from the DOM on mount.
 */
export const appearanceScope = defineScope();
