/**
 * Unit tests for the three modals' visibility. Each is bound to the record it
 * opened over rather than to a bare flag, and each gets out of the way off
 * the back of the errand it was opened for finishing — a form left open over
 * the wrong record would rename or forget the wrong record.
 */

import { createTestRuntime } from '@lib/state';
import {
  inviteClosedTopic,
  inviteOpenedTopic,
  inviteStore,
  removalClosedTopic,
  removalOpenedTopic,
  removalStore,
  renameClosedTopic,
  renameOpenedTopic,
  renameStore,
} from '../dialogs';
import { contactRenamedTopic, contactSeenTopic } from '../../contacts';
import { deviceNamedTopic } from '../../identity';
import { beamScope } from '../../scope';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

describe('inviteStore', () => {
  it('starts out of the way', () => {
    const { peek } = setup();

    expect(peek(inviteStore).open).toBe(false);
  });

  it('opens on request', () => {
    const { commit, peek } = setup();

    commit(inviteOpenedTopic());

    expect(peek(inviteStore).open).toBe(true);
  });

  it('closes again on dismissal', () => {
    const { commit, peek } = setup();
    commit(inviteOpenedTopic());

    commit(inviteClosedTopic());

    expect(peek(inviteStore).open).toBe(false);
  });

  it('steps aside once a peer turns up', () => {
    const { commit, peek } = setup();
    commit(inviteOpenedTopic());

    commit(contactSeenTopic({ endpointId: 'ep-1', seenAt: 1 }));

    // Meeting somebody is the errand the dialog was open for finishing.
    expect(peek(inviteStore).open).toBe(false);
  });
});

describe('renameStore', () => {
  it('starts shut', () => {
    const { peek } = setup();

    expect(peek(renameStore).target).toBeNull();
  });

  it('opens over the contact it was asked for', () => {
    const { commit, peek } = setup();

    commit(renameOpenedTopic({ kind: 'peer', endpointId: 'ep-1' }));

    expect(peek(renameStore).target).toEqual({
      kind: 'peer',
      endpointId: 'ep-1',
    });
  });

  it('opens over this device', () => {
    const { commit, peek } = setup();

    commit(renameOpenedTopic({ kind: 'self' }));

    expect(peek(renameStore).target).toEqual({ kind: 'self' });
  });

  it('closes on dismissal', () => {
    const { commit, peek } = setup();
    commit(renameOpenedTopic({ kind: 'peer', endpointId: 'ep-1' }));

    commit(renameClosedTopic());

    expect(peek(renameStore).target).toBeNull();
  });

  it('closes itself once the rename lands', () => {
    const { commit, peek } = setup();
    commit(renameOpenedTopic({ kind: 'peer', endpointId: 'ep-1' }));

    commit(contactRenamedTopic({ endpointId: 'ep-1', label: 'Work phone' }));

    expect(peek(renameStore).target).toBeNull();
  });

  it('stays open when a different contact is renamed', () => {
    const { commit, peek } = setup();
    commit(renameOpenedTopic({ kind: 'peer', endpointId: 'ep-1' }));

    commit(contactRenamedTopic({ endpointId: 'ep-2', label: 'Laptop' }));

    expect(peek(renameStore).target).toEqual({
      kind: 'peer',
      endpointId: 'ep-1',
    });
  });

  it('closes itself once this device is named', () => {
    const { commit, peek } = setup();
    commit(renameOpenedTopic({ kind: 'self' }));

    commit(deviceNamedTopic({ endpointId: 'ep-self', label: 'Studio', at: 1 }));

    expect(peek(renameStore).target).toBeNull();
  });

  it('leaves a contact form open when this device is named', () => {
    const { commit, peek } = setup();
    commit(renameOpenedTopic({ kind: 'peer', endpointId: 'ep-1' }));

    commit(deviceNamedTopic({ endpointId: 'ep-self', label: 'Studio', at: 1 }));

    // The two names are edited through the same form but they are not the
    // same record, and naming one is no reason to drop what was typed into
    // the other.
    expect(peek(renameStore).target).toEqual({
      kind: 'peer',
      endpointId: 'ep-1',
    });
  });

  it('leaves this device’s form open when a contact is renamed', () => {
    const { commit, peek } = setup();
    commit(renameOpenedTopic({ kind: 'self' }));

    commit(contactRenamedTopic({ endpointId: 'ep-1', label: 'Laptop' }));

    expect(peek(renameStore).target).toEqual({ kind: 'self' });
  });
});

describe('removalStore', () => {
  it('starts shut', () => {
    const { peek } = setup();

    expect(peek(removalStore).endpointId).toBeNull();
  });

  it('opens over the contact it was asked for', () => {
    const { commit, peek } = setup();

    commit(removalOpenedTopic('ep-1'));

    expect(peek(removalStore).endpointId).toBe('ep-1');
  });

  it('closes on an answer', () => {
    const { commit, peek } = setup();
    commit(removalOpenedTopic('ep-1'));

    commit(removalClosedTopic());

    expect(peek(removalStore).endpointId).toBeNull();
  });

  it('re-aims at the contact most recently asked about', () => {
    const { commit, peek } = setup();
    commit(removalOpenedTopic('ep-1'));

    commit(removalOpenedTopic('ep-2'));

    expect(peek(removalStore).endpointId).toBe('ep-2');
  });
});
