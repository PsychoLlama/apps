import { defineScope } from '@lib/state-next';

/**
 * Owns the launcher's view of which gated apps are visible, and the
 * runtime-config subscription feeding it. `Launcher` anchors it while the
 * front door is on screen; releasing the last anchor tears the
 * subscription down.
 *
 * Nothing durable dies with it. OPFS holds the overrides, and the store is
 * a mirror re-read on mount.
 */
export const launcherScope = defineScope();
