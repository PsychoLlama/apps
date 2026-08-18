import {
  defineFold,
  defineFormula,
  defineStore,
  defineTopic,
} from '@lib/state';
import { logsScope } from '../scope';

/** The condition gating the logs header's export action. */
export interface ExportGateState {
  /**
   * `true` once a service worker controls the page and will therefore
   * intercept same-origin navigations. The export download is answered
   * entirely by the worker, so this gates the action: without a controlling
   * worker the navigation escapes to the network and 404s.
   *
   * Seeded `false` — there is no worker during SSG, and on the client's first
   * paint control isn't yet confirmed.
   */
  controlled: boolean;
}

/** Source of truth for the export action's visibility. */
export const exportGateStore = defineStore<ExportGateState>(logsScope, () => ({
  controlled: false,
}));

/**
 * Whether the export action can be offered: there's a worker to answer the
 * download. Without one it's a dead button.
 */
export const exportAvailableFormula = defineFormula(
  [exportGateStore],
  (gate) => gate.controlled,
);

/** A service worker claimed the page, or handed control on. */
export const workerControlChangedTopic = defineTopic<boolean>();
defineFold(workerControlChangedTopic, [exportGateStore], (gate, controlled) => {
  gate.controlled = controlled;
});
