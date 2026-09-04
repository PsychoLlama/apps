import { defineScope } from '@lib/state';

/**
 * Owns the floating-window controls. Page-local and short-lived —
 * nothing here outlives the route.
 */
export const scratchpadScope = defineScope();
