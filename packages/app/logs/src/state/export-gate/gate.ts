import {
  defineFold,
  defineFormula,
  defineStore,
  defineTopic,
} from '@lib/state';
import { environment } from '@lib/runtime-config';
import { logExport } from '../../config';
import { logsScope } from '../scope';

/** The two conditions gating the logs header's export action. */
export interface ExportGateState {
  /**
   * `true` when logs export is enabled for the active environment. Seeded from
   * the option's per-environment default so prerender and the client's first
   * paint agree (no hydration flash); a client-only saga then reconciles it
   * with any persisted OPFS override.
   */
  enabled: boolean;

  /**
   * `true` once a service worker controls the page and will therefore
   * intercept same-origin navigations. The export download is answered
   * entirely by the worker, so this gates the action too: without a
   * controlling worker the navigation escapes to the network and 404s.
   *
   * Seeded `false` — there is no worker during SSG, and on the client's first
   * paint control isn't yet confirmed.
   */
  controlled: boolean;
}

/** Source of truth for the export action's visibility. */
export const exportGateStore = defineStore<ExportGateState>(logsScope, () => ({
  enabled: logExport.defaults[environment].enabled,
  controlled: false,
}));

/**
 * Whether the export action can be offered: the feature is on *and* there's a
 * worker to answer the download. Either one alone is a dead button.
 */
export const exportAvailableFormula = defineFormula(
  [exportGateStore],
  (gate) => gate.enabled && gate.controlled,
);

/**
 * Both conditions were resolved together at mount, layering any persisted OPFS
 * override over the seeded flag and confirming who controls the page.
 */
export const exportGateRestoredTopic = defineTopic<ExportGateState>();
defineFold(exportGateRestoredTopic, [exportGateStore], (gate, values) => {
  gate.enabled = values.enabled;
  gate.controlled = values.controlled;
});

/** The export flag resolved to a new value, in this tab or another. */
export const exportFlagChangedTopic = defineTopic<boolean>();
defineFold(exportFlagChangedTopic, [exportGateStore], (gate, enabled) => {
  gate.enabled = enabled;
});

/** A service worker claimed the page, or handed control on. */
export const workerControlChangedTopic = defineTopic<boolean>();
defineFold(workerControlChangedTopic, [exportGateStore], (gate, controlled) => {
  gate.controlled = controlled;
});
