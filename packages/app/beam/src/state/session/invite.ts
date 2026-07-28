import { defineFold, defineStore, defineTopic } from '@lib/state';
import { contactSeenTopic } from '../contacts';
import { beamScope } from '../scope';

/**
 * Whether the invite is on screen. The dialog is fully controlled, and Solid's
 * local state primitives are off-limits in app packages, so the flag lives in
 * the scope like everything else — which also means walking away from the page
 * takes the dialog down with the scope rather than stranding it open.
 */
export interface Invite {
  /** Whether the invite dialog is showing. */
  open: boolean;
}

/** Whether the invite is on screen. */
export const inviteStore = defineStore<Invite>(beamScope, () => ({
  open: false,
}));

/** The invite was asked for. */
export const inviteOpenedTopic = defineTopic();
defineFold(inviteOpenedTopic, [inviteStore], (invite) => {
  invite.open = true;
});

/** The invite was dismissed. */
export const inviteClosedTopic = defineTopic();
defineFold(inviteClosedTopic, [inviteStore], (invite) => {
  invite.open = false;
});

// A peer dialling in is the errand finishing: the link was handed over and
// somebody used it. Getting the dialog out of the way is what lets the
// request behind it be seen — it's a modal, so a pairing request that
// arrives while it's up would otherwise sit under the overlay unnoticed.
//
// Only an inbound sighting. Our own dial, from a share view, is us going
// somewhere rather than someone arriving.
defineFold(contactSeenTopic, [inviteStore], (invite, { direction }) => {
  if (direction === 'inbound') invite.open = false;
});
