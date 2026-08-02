/**
 * Unit tests for which screen `/beam/*` shows. The formula reads one store
 * and nothing else, so every case here is reached by committing the facts
 * that put it where it needs to be — no sagas, no capabilities.
 */

import { createTestRuntime } from '@lib/state';
import {
  onboardingAdvancedTopic,
  onboardingLoadFailedTopic,
  onboardingLoadingTopic,
  onboardingRestoredTopic,
} from '../../onboarding/progress';
import { beamSurfaceFormula, surfaceForRoute } from '../surface';
import { beamScope } from '../../scope';

const PEER_ID = `e2${'0'.repeat(62)}`;

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

describe('beamSurfaceFormula', () => {
  it('shows nothing until the disk has answered', () => {
    const { peek } = setup();

    // Prerender and first paint. Committing to a screen here means swapping
    // it a moment later, which is a flash of the wrong app.
    expect(peek(beamSurfaceFormula)).toBe('unknown');
  });

  it('shows nothing while the read is in flight', () => {
    const { commit, peek } = setup();

    commit(onboardingLoadingTopic());

    expect(peek(beamSurfaceFormula)).toBe('unknown');
  });

  it('opens setup on a device nobody has named', () => {
    const { commit, peek } = setup();

    commit(onboardingRestoredTopic(null));

    // Nothing stored is a device nobody has started setting up.
    expect(peek(beamSurfaceFormula)).toBe('naming');
  });

  it('asks a named device to connect one', () => {
    const { commit, peek } = setup();

    commit(onboardingRestoredTopic({ step: 'pairing', updatedAt: 1 }));

    expect(peek(beamSurfaceFormula)).toBe('pairing');
  });

  it('hands a set-up device the session', () => {
    const { commit, peek } = setup();

    commit(onboardingRestoredTopic({ step: 'done', updatedAt: 1 }));

    expect(peek(beamSurfaceFormula)).toBe('session');
  });

  it('turns the screen over the moment a step lands', () => {
    const { commit, peek } = setup();
    commit(onboardingRestoredTopic(null));

    commit(onboardingAdvancedTopic({ step: 'pairing', updatedAt: 2 }));

    // The write to disk trails the commit, and the reader shouldn't be
    // watching a spinner for it.
    expect(peek(beamSurfaceFormula)).toBe('pairing');
  });

  it('stays out of the way when the progress could not be read', () => {
    const { commit, peek } = setup();

    commit(onboardingLoadFailedTopic());

    // We don't know how far this device got. Setup is a claim that we do, and
    // it would ask someone to name a device their contacts may already know —
    // the session at least gets to say something went wrong.
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

    // Step one in particular: the device could dial, and would land in a
    // stranger's address book as the unnamed device step one exists to
    // prevent.
    expect(surfaceForRoute('naming', link)).toBe('naming');
    expect(surfaceForRoute('unknown', link)).toBe('unknown');
    expect(surfaceForRoute('session', link)).toBe('session');
  });
});
