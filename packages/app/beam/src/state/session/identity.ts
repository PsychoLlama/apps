import { defineFold, defineStore, defineTopic } from '@lib/state';
import { beamScope } from '../scope';

/** Who this device is on the network, as far as anyone else is concerned. */
export interface SelfIdentity {
  /**
   * This device's endpoint address, or `null` before the key has been
   * loaded — including during SSG and first paint.
   *
   * The public half only. The secret it's derived from stays in the
   * capability layer and never reaches a store: it *is* this device, and
   * state here is read by anything that asks.
   */
  endpointId: string | null;
}

/** Who this device is on the network. */
export const identityStore = defineStore<SelfIdentity>(beamScope, () => ({
  endpointId: null,
}));

/**
 * The endpoint key was restored or minted, settling this device's address.
 *
 * Its own fact rather than part of the connection landing, because it happens
 * far earlier: the address is derived from the key, so it's readable as soon
 * as the wasm is up and the vault has answered — no relay involved. That's
 * what lets the header name this device, and the invite show its link, while
 * the handshake is still in flight.
 */
export const identityResolvedTopic = defineTopic<string>();
defineFold(identityResolvedTopic, [identityStore], (self, endpointId) => {
  self.endpointId = endpointId;
});
