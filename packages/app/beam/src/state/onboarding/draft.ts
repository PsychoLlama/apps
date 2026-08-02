/**
 * What the setup form is holding while it's being filled in.
 *
 * In the scope rather than in the field because the form is torn down and
 * rebuilt around it: leaving the step and coming back, or a save that didn't
 * land, should still have the name typed a moment ago rather than asking for
 * it again.
 */

import { defineFold, defineStore, defineTopic } from '@lib/state';
import { deviceNamedTopic } from '../device/device';
import { beamScope } from '../scope';

/** The half-filled setup form. */
export interface SetupDraft {
  /**
   * The name typed into the setup form, exactly as typed. Unnormalized —
   * trimming under the caret would fight whoever is typing, and the rule that
   * decides what a name may be runs when the name is used.
   */
  name: string;
}

/** What the setup form holds. */
export const setupDraftStore = defineStore<SetupDraft>(beamScope, () => ({
  name: '',
}));

/** The reader typed into the setup form. */
export const setupNameChangedTopic = defineTopic<string>();
defineFold(setupNameChangedTopic, [setupDraftStore], (draft, name) => {
  draft.name = name;
});

// A name that landed takes the draft with it. Folding the device's own topic
// keeps that automatic, and keeps it on exactly the right side of the line:
// the name belongs to the device now, so the form has nothing left to hold —
// while a name the device *refused* never publishes this, and the draft
// survives for the retry.
defineFold(deviceNamedTopic, [setupDraftStore], (draft) => {
  draft.name = '';
});
