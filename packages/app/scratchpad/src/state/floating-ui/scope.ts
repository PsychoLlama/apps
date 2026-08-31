import { defineScope } from '@lib/state';

/**
 * Owns the floating-window controls, the captured anchor handle, and the
 * runtime-config subscription backing the persisted ones.
 *
 * Nothing durable dies with it. OPFS holds the persisted overrides, and
 * the store is a mirror re-read on mount.
 */
export const scratchpadScope = defineScope();
