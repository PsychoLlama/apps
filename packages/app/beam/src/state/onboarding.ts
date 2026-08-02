/**
 * What the setup form is holding while it's being filled in.
 *
 * In the scope rather than in the field because the form is torn down and
 * rebuilt around it: a mint that fails puts the device back on step one, and
 * the name typed a moment ago should still be there rather than having to be
 * typed again.
 */

import { defineFold, defineStore, defineTopic } from '@lib/state';
import { identityResolvedTopic } from './session';
import { beamScope } from './scope';

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

// A landed identity takes the draft with it. Folding the session's own topic
// keeps that automatic, and keeps it on exactly the right side of the line:
// the name is now the device's, so the form has nothing left to hold — while
// a mint that *failed* never publishes this, and the draft survives for the
// retry.
defineFold(identityResolvedTopic, [setupDraftStore], (draft) => {
  draft.name = '';
});
