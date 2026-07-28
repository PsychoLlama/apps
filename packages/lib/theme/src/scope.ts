import { defineScope } from '@lib/state-next';

/**
 * Owns the runtime view of the three appearance preferences: theme,
 * color-scheme, and motion. Anchored by whatever surface displays or
 * changes them — the settings page for its lifetime, the appearance
 * toggle for its own.
 *
 * Nothing is lost when the last anchor releases. The DOM attributes the
 * prelude stamps onto `<html>` are the canonical record; this scope holds
 * a mirror of them, and every consumer re-hydrates from the DOM on mount.
 */
export const appearanceScope = defineScope();
