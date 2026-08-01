import {
  defineFold,
  defineFormula,
  defineStore,
  defineTopic,
} from '@lib/state';
import { generateLabel } from '../labels';
import { beamScope } from '../scope';

/**
 * How far this device has got in knowing who it is.
 *
 * - `pending` — the key hasn't answered yet: the wasm is instantiating, the
 *   vault is being read, or this is prerender and first paint, where neither
 *   can run at all.
 * - `absent` — asked and answered: there is no key on this device. This is
 *   the whole of how the surface knows the device hasn't been set up, and
 *   it's the state the onboarding flow exists to leave.
 * - `ready` — the key loaded, and `endpointId` is the address derived from it.
 * - `failed` — the load errored, so which of the two above is true is
 *   unknown. Distinct from `absent` on purpose: a device whose vault we
 *   couldn't reach is not a device without a key, and treating it as one
 *   would offer to mint a second identity over the top of a working one.
 */
export type IdentityStatus = 'pending' | 'absent' | 'ready' | 'failed';

/** Who this device is on the network, as far as anyone else is concerned. */
export interface SelfIdentity {
  /** Whether this device has an endpoint key, and whether we know yet. */
  status: IdentityStatus;

  /**
   * This device's endpoint address, or `null` for every status but `ready`.
   *
   * The public half only. The secret it's derived from stays in the
   * capability layer and never reaches a store: it *is* this device, and
   * state here is read by anything that asks.
   */
  endpointId: string | null;
}

/** Who this device is on the network. */
export const identityStore = defineStore<SelfIdentity>(beamScope, () => ({
  status: 'pending',
  endpointId: null,
}));

/**
 * The endpoint key was restored, settling this device's address.
 *
 * Its own fact rather than part of the connection landing, because it happens
 * far earlier: the address is derived from the key, so it's readable as soon
 * as the wasm is up and the vault has answered — no relay involved. That's
 * what lets the header name this device, and the invite show its link, while
 * the handshake is still in flight.
 */
export const identityResolvedTopic = defineTopic<string>();
defineFold(identityResolvedTopic, [identityStore], (self, endpointId) => {
  self.status = 'ready';
  self.endpointId = endpointId;
});

/**
 * The vault answered, and there is no endpoint key on this device.
 *
 * The one fact the onboarding flow hangs off. Nothing is wrong here — it's
 * what a device looks like before anybody has set it up — so it's an
 * ordinary settling of the identity rather than a failure, and the surface
 * reads it as "onboard" rather than "retry".
 */
export const identityAbsentTopic = defineTopic();
defineFold(identityAbsentTopic, [identityStore], (self) => {
  self.status = 'absent';
});

/**
 * The identity load errored, leaving this device's key unknown. Payload-less:
 * the failure is logged where it happens, and what's left to render is the
 * same whichever way it broke.
 */
export const identityFailedTopic = defineTopic();
defineFold(identityFailedTopic, [identityStore], (self) => {
  self.status = 'failed';
});

/**
 * What this device calls itself: the name generated from its own endpoint
 * key. Read-only and unconfigurable for now — the point is that both sides of
 * a pairing can name each other before either has typed anything, and a name
 * derived from the key needs no exchange to agree on.
 *
 * `null` until the key lands, which is a moment or two after mount rather
 * than a relay round trip away.
 */
export const selfLabelFormula = defineFormula([identityStore], (self) =>
  self.endpointId ? generateLabel(self.endpointId) : null,
);
