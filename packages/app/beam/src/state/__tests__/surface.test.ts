/**
 * Unit tests for which screen `/beam/*` shows. The formula reads two stores
 * and nothing else, so every case here is reached by committing the facts
 * that put those stores where they need to be — no sagas, no capabilities.
 */

import { createTestRuntime } from '@lib/state';
import {
  contactSeenTopic,
  contactsLoadFailedTopic,
  contactsLoadingTopic,
  contactsRestoredTopic,
} from '../contacts/contacts';
import {
  identityAbsentTopic,
  identityFailedTopic,
  identityResolvedTopic,
} from '../session/identity';
import { beamSurfaceFormula, surfaceForRoute } from '../surface';
import { beamScope } from '../scope';

const SELF_ID = `e1${'0'.repeat(62)}`;
const PEER_ID = `e2${'0'.repeat(62)}`;

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

/** A settled identity and an address book that read back empty. */
const setUpDevice = (commit: ReturnType<typeof setup>['commit']) => {
  commit(identityResolvedTopic({ endpointId: SELF_ID, label: null }));
  commit(contactsRestoredTopic([]));
};

describe('beamSurfaceFormula', () => {
  it('shows nothing until the vault has answered', () => {
    const { peek } = setup();

    // Prerender and first paint. Committing to a screen here means swapping
    // it a moment later, which is a flash of the wrong app.
    expect(peek(beamSurfaceFormula)).toBe('unknown');
  });

  it('opens onboarding on a device with no key', () => {
    const { commit, peek } = setup();

    commit(identityAbsentTopic());

    expect(peek(beamSurfaceFormula)).toBe('identity');
  });

  it('waits on the address book before claiming nobody is in it', () => {
    const { commit, peek } = setup();
    commit(identityResolvedTopic({ endpointId: SELF_ID, label: null }));

    commit(contactsLoadingTopic());

    // An empty book that hasn't loaded says nothing, and step two is a claim
    // that this device has never met anyone.
    expect(peek(beamSurfaceFormula)).toBe('unknown');
  });

  it('asks a keyed device with no contacts to connect one', () => {
    const { commit, peek } = setup();

    setUpDevice(commit);

    expect(peek(beamSurfaceFormula)).toBe('pairing');
  });

  it('ends onboarding at the first contact', () => {
    const { commit, peek } = setup();
    setUpDevice(commit);

    commit(
      contactSeenTopic({
        endpointId: PEER_ID,
        direction: 'inbound',
        seenAt: 1,
      }),
    );

    // Meeting a device is the thing step two was asking for, so it's what
    // ends it — no flag, and nothing to dismiss.
    expect(peek(beamSurfaceFormula)).toBe('session');
  });

  it('stays out of the way when the key could not be read', () => {
    const { commit, peek } = setup();

    commit(identityFailedTopic());

    // We don't know whether this device has a key. Onboarding is a claim
    // that we do, and it would offer to mint a second one over a working
    // first — the session at least gets to say something went wrong.
    expect(peek(beamSurfaceFormula)).toBe('session');
  });

  it('stays out of the way when the address book could not be read', () => {
    const { commit, peek } = setup();
    commit(identityResolvedTopic({ endpointId: SELF_ID, label: null }));

    commit(contactsLoadFailedTopic());

    // Same reasoning one layer down: asking a device to meet its first peer
    // would be doing it in front of contacts it may already have.
    expect(peek(beamSurfaceFormula)).toBe('session');
  });
});

describe('surfaceForRoute', () => {
  it('lets a beam link through step two', () => {
    expect(surfaceForRoute('pairing', `/beam/share/${PEER_ID}`)).toBe(
      'session',
    );
  });

  it('keeps step two everywhere else', () => {
    expect(surfaceForRoute('pairing', '/beam')).toBe('pairing');
    expect(surfaceForRoute('pairing', `/beam/contacts/${PEER_ID}`)).toBe(
      'pairing',
    );
  });

  it('leaves every other surface alone on a beam link', () => {
    const link = `/beam/share/${PEER_ID}`;

    // Step one in particular: there is no key yet, so the share view would
    // have nothing to dial from.
    expect(surfaceForRoute('identity', link)).toBe('identity');
    expect(surfaceForRoute('unknown', link)).toBe('unknown');
    expect(surfaceForRoute('session', link)).toBe('session');
  });
});
