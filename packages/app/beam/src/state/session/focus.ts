import {
  defineFold,
  defineFormula,
  defineStore,
  defineTopic,
} from '@lib/state';
import { addressBookFormula } from '../contacts';
import { generateLabel } from '../labels';
import { beamScope } from '../scope';
import { shareStatesFormula, type ShareState } from './pairing';

/**
 * The peer the reader is currently engaged with — the one whose share view is
 * open.
 *
 * Kept in state rather than read off the route because the chrome that reports
 * it outlives any one route: the status bar is mounted by the layout, and
 * `/beam/share/:id` and `/beam/contacts/:id` are indistinguishable from a
 * layout's params. The view that knows which it is says so.
 *
 * The link statuses can't answer this on their own. They record every peer
 * something has been tried with and keep a failed dial's entry until something
 * dials again, so "there's a status for this peer" is not the same question as
 * "the reader is looking at it right now".
 */
export interface Focus {
  /** The peer whose view is open, or `null` when none is. */
  endpointId: string | null;
}

/** The peer whose share view is open. */
export const focusStore = defineStore<Focus>(beamScope, () => ({
  endpointId: null,
}));

/** A share view opened on a peer. */
export const peerFocusedTopic = defineTopic<string>();
defineFold(peerFocusedTopic, [focusStore], (focus, endpointId) => {
  focus.endpointId = endpointId;
});

/**
 * A share view closed. Carries the id rather than clearing outright, so a
 * cleanup that runs after the next view has already opened — which is the
 * order moving between two peers gives you — can't take down the focus that
 * replaced it.
 */
export const peerBlurredTopic = defineTopic<string>();
defineFold(peerBlurredTopic, [focusStore], (focus, endpointId) => {
  if (focus.endpointId !== endpointId) return;
  focus.endpointId = null;
});

/** The focused peer, named and with its connection state resolved. */
export interface FocusedPeer {
  endpointId: string;
  /** What to call it — the contact's name, or the key prefix until there is one. */
  name: string;
  /** Where the connection to it stands. */
  state: ShareState;
}

/**
 * The focused peer as chrome reads it: who, and how the connection to them is
 * going. `null` whenever no share view is open, which is what keeps the status
 * bar's trailing edge empty until there's something to report.
 *
 * A peer nothing has been tried with yet reads as `preparing` — the same
 * fallback the share view uses, and the right answer for the beat between the
 * view opening and the dial going out.
 */
export const focusedPeerFormula = defineFormula(
  [focusStore, addressBookFormula, shareStatesFormula],
  (focus, contacts, states): FocusedPeer | null => {
    const { endpointId } = focus;
    if (!endpointId) return null;

    const contact = contacts.find((view) => view.endpointId === endpointId);

    return {
      endpointId,
      name: contact?.name ?? generateLabel(endpointId),
      state: states[endpointId] ?? 'preparing',
    };
  },
);
