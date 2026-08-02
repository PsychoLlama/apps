/**
 * Unit tests for what this device calls itself: the folds that settle the
 * name, and the formula that decides what to show when nobody has set one.
 */

import { createTestRuntime } from '@lib/state';
import {
  deviceLoadFailedTopic,
  deviceLoadingTopic,
  deviceNamedTopic,
  deviceRestoredTopic,
  deviceStore,
  selfLabelFormula,
} from '../device';
import { identityResolvedTopic } from '../../session/identity';
import { generateLabel } from '../../labels';
import { beamScope } from '../../scope';

/** A well-formed endpoint id, for the tests that read a name out of one. */
const SELF_ID = `e1${'0'.repeat(62)}`;

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

describe('deviceStore', () => {
  it('knows nothing about this device before the disk answers', () => {
    const { peek } = setup();

    // Not a `ready` device with no name — that's a claim, and prerender is in
    // no position to make one. Setup hangs off this, so seeding it would walk
    // every device through naming on first paint.
    expect(peek(deviceStore).status).toBe('initial');
    expect(peek(deviceStore).label).toBeNull();
  });

  it('marks the read as under way', () => {
    const { commit, peek } = setup();

    commit(deviceLoadingTopic());

    expect(peek(deviceStore).status).toBe('loading');
  });
});

describe('deviceRestoredTopic', () => {
  it('takes back the name this device was given', () => {
    const { commit, peek } = setup();

    commit(deviceRestoredTopic('Studio'));

    expect(peek(deviceStore).status).toBe('ready');
    expect(peek(deviceStore).label).toBe('Studio');
  });

  it('reads an empty table as a device nobody has named', () => {
    const { commit, peek } = setup();

    commit(deviceRestoredTopic(null));

    expect(peek(deviceStore).status).toBe('ready');
    expect(peek(deviceStore).label).toBeNull();
  });

  it('holds a stored name against the rule every name obeys', () => {
    const { commit, peek } = setup();

    commit(deviceRestoredTopic('  Studio  '));

    // The rule can tighten between the write and the read, and what came off
    // disk gets no exemption from the one in force now.
    expect(peek(deviceStore).label).toBe('Studio');
  });
});

describe('deviceLoadFailedTopic', () => {
  it('keeps an unreadable name apart from an absent one', () => {
    const { commit, peek } = setup();

    commit(deviceLoadFailedTopic());

    expect(peek(deviceStore).status).toBe('failed');
    expect(peek(deviceStore).label).toBeNull();
  });
});

describe('deviceNamedTopic', () => {
  it('normalizes the name on the way in', () => {
    const { commit, peek } = setup();

    commit(deviceNamedTopic('  Kitchen iPad '));

    expect(peek(deviceStore).label).toBe('Kitchen iPad');
  });

  it('settles a device whose disk would not open', () => {
    const { commit, peek } = setup();
    commit(deviceLoadFailedTopic());

    commit(deviceNamedTopic('Studio'));

    // A name typed a second ago is the truth about this device whatever the
    // disk said. Left `failed`, the surface would go on treating it as
    // unknown.
    expect(peek(deviceStore).status).toBe('ready');
    expect(peek(deviceStore).label).toBe('Studio');
  });
});

describe('selfLabelFormula', () => {
  it('has nothing to say before the key lands', () => {
    const { commit, peek } = setup();

    commit(deviceNamedTopic('Studio'));

    // A name with no address behind it isn't yet a device anyone can reach.
    expect(peek(selfLabelFormula)).toBeNull();
  });

  it('answers with the name the reader chose', () => {
    const { commit, peek } = setup();
    commit(identityResolvedTopic(SELF_ID));

    commit(deviceNamedTopic('Studio'));

    expect(peek(selfLabelFormula)).toBe('Studio');
  });

  it('falls back to the key prefix until somebody names it', () => {
    const { commit, peek } = setup();

    commit(identityResolvedTopic(SELF_ID));

    // Derived from the key, so it needs no exchange to agree on, and it's the
    // same name an unnamed contact wears — a device that reaches a peer
    // before anyone named it still arrives as somebody.
    expect(peek(selfLabelFormula)).toBe(generateLabel(SELF_ID));
  });
});
