/**
 * Unit tests for the rename form's visibility. The form is bound to a record
 * rather than to a bare flag, and it closes itself off the back of the rename
 * landing — both are worth pinning, since a form left open over the wrong
 * record would rename the wrong record.
 */

import { createTestRuntime } from '@lib/state';
import { contactRenamedTopic, selfNamedTopic } from '../contacts';
import { renameClosedTopic, renameOpenedTopic, renameStore } from '../rename';
import { beamScope } from '../../scope';

const setup = () => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  return runtime;
};

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

    commit(selfNamedTopic({ endpointId: 'ep-self', label: 'Studio', at: 1 }));

    expect(peek(renameStore).target).toBeNull();
  });

  it('leaves a contact form open when this device is named', () => {
    const { commit, peek } = setup();
    commit(renameOpenedTopic({ kind: 'peer', endpointId: 'ep-1' }));

    commit(selfNamedTopic({ endpointId: 'ep-self', label: 'Studio', at: 1 }));

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
