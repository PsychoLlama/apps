import {
  defineFold,
  defineFormula,
  defineStore,
  defineTopic,
} from '@lib/state';
import { generateLabel, normalizeLabel } from '../labels';
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

  /**
   * The name the reader gave this device when they set it up, or `null` if
   * they left it blank. `null` is not "unnamed" as far as anyone else is
   * concerned — {@link selfLabelFormula} falls back to the key prefix, which
   * is the same name an unnamed contact wears.
   */
  label: string | null;
}

/** Who this device is on the network. */
export const identityStore = defineStore<SelfIdentity>(beamScope, () => ({
  status: 'pending',
  endpointId: null,
  label: null,
}));

/**
 * The endpoint key settled this device's address — restored from the vault, or
 * minted just now by setting the device up. One fact for both, because from
 * here on there is no difference: a key is a key, and everything downstream
 * wants the address rather than its provenance.
 *
 * Its own fact rather than part of the connection landing, because it happens
 * far earlier: the address is derived from the key, so it's readable as soon
 * as the wasm is up and the vault has answered — no relay involved. That's
 * what lets the header name this device, and the invite show its link, while
 * the handshake is still in flight.
 */
export const identityResolvedTopic = defineTopic<{
  /** This device's endpoint address, as hex. */
  endpointId: string;

  /** The name chosen for this device, as typed, or `null` for none. */
  label: string | null;
}>();

defineFold(identityResolvedTopic, [identityStore], (self, resolved) => {
  self.status = 'ready';
  self.endpointId = resolved.endpointId;
  self.label = normalizeLabel(resolved.label ?? '');
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
 * What this device calls itself, and what it advertises to every peer it
 * links with: the name chosen when the device was set up, or the prefix of
 * its own endpoint key if that name can't be recovered.
 *
 * Setting a device up requires a name, so the fallback is a safety net rather
 * than an option — it's what a device wears when the vault lost the name but
 * kept the key. Being derived from the key, it needs no exchange to agree on,
 * and it's the same name an unnamed contact goes by, so a device that fell
 * back is still a device with a name.
 *
 * `null` until the key lands, which is a moment or two after mount rather
 * than a relay round trip away.
 */
export const selfLabelFormula = defineFormula([identityStore], (self) => {
  if (!self.endpointId) return null;
  return self.label ?? generateLabel(self.endpointId);
});
