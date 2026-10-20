import { defineScope } from '@lib/state';

/**
 * Owns the runtime view of the theme preference. Anchored by whatever
 * surface displays or changes it — the settings page, for its lifetime.
 *
 * Nothing is lost when the last anchor releases. The DOM attribute the
 * prelude stamps onto `<html>` is the canonical record; this scope holds
 * a mirror of it, and every consumer re-hydrates from the DOM on mount.
 */
export const appearanceScope = defineScope();
