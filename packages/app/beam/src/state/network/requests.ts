import {
  defineFold,
  defineFormula,
  defineStore,
  defineTopic,
} from '@lib/state';
import {
  addressBookFormula,
  contactForgottenTopic,
  type ContactView,
} from '../contacts';
import { beamScope } from '../scope';
import { peerLinkedTopic } from './peers';

/**
 * Pairing requests the reader has waved off, for this session only.
 *
 * Refusing is inaction — the contact stays `invited`, granting nothing — so
 * there's nothing to persist and nothing to undo. All this remembers is that
 * the prompt has been answered, so it stops asking. A reload, or the same
 * peer dialling in again, is a fresh ask rather than a bypass: neither one
 * moves the contact along the trust ladder, it just gets shown again.
 */
export interface Requests {
  /** Endpoint ids whose request has been dismissed this session. */
  dismissed: Record<string, true>;
}

/** Pairing requests waved off this session. */
export const requestsStore = defineStore<Requests>(beamScope, () => ({
  dismissed: {},
}));

/** A pairing request was waved off. */
export const requestDismissedTopic = defineTopic<string>();
defineFold(requestDismissedTopic, [requestsStore], (requests, endpointId) => {
  requests.dismissed[endpointId] = true;
});

// A peer dialling in again is asking again, so the prompt comes back. This
// is the only thing that clears a dismissal mid-session, and it clears it
// for a link in either direction — a peer we just reached is one that's
// awake, which is exactly when answering it is worth something.
defineFold(peerLinkedTopic, [requestsStore], (requests, { endpointId }) => {
  delete requests.dismissed[endpointId];
});

// Forgetting a contact takes its dismissal with it, so the record doesn't
// outlive the thing it was about.
defineFold(contactForgottenTopic, [requestsStore], (requests, endpointId) => {
  delete requests.dismissed[endpointId];
});

/**
 * Peers waiting on an answer from the reader: filed as `invited` inbound,
 * and not yet waved off. Drawn from the resolved address book, so a request
 * wears the same name the contact does.
 *
 * Deliberately not gated on a live link. An invite is persisted precisely so
 * it survives a reload, and a request you can only answer while the other
 * device happens to be awake is one you'd miss. Accepting an absent peer
 * still promotes the pairing here; the peer learns of it the next time the
 * two connect.
 *
 * Ordered oldest first, unlike the address book's alphabetical sort. These
 * are a queue of unanswered questions, and the one that has been waiting
 * longest is the one to answer first.
 */
export const pairingRequestsFormula = defineFormula(
  [addressBookFormula, requestsStore],
  (contacts, requests): ContactView[] =>
    contacts
      .filter(
        (contact) =>
          contact.trust === 'invited' &&
          contact.direction === 'inbound' &&
          !requests.dismissed[contact.endpointId],
      )
      .sort(
        (left, right) =>
          left.createdAt - right.createdAt ||
          left.endpointId.localeCompare(right.endpointId),
      ),
);
