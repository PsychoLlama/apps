/**
 * Unit tests for the rename form's visibility. The form is bound to an
 * endpoint rather than to a bare flag, and it closes itself off the back of
 * the rename landing — both are worth pinning, since a form left open over
 * the wrong contact would rename the wrong contact.
 */

import { createTestRuntime } from '@lib/state';
import { contactRenamedTopic } from '../contacts';
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

    expect(peek(renameStore).endpointId).toBeNull();
  });

  it('opens over the contact it was asked for', () => {
    const { commit, peek } = setup();

    commit(renameOpenedTopic('ep-1'));

    expect(peek(renameStore).endpointId).toBe('ep-1');
  });

  it('closes on dismissal', () => {
    const { commit, peek } = setup();
    commit(renameOpenedTopic('ep-1'));

    commit(renameClosedTopic());

    expect(peek(renameStore).endpointId).toBeNull();
  });

  it('closes itself once the rename lands', () => {
    const { commit, peek } = setup();
    commit(renameOpenedTopic('ep-1'));

    commit(contactRenamedTopic({ endpointId: 'ep-1', label: 'Work phone' }));

    expect(peek(renameStore).endpointId).toBeNull();
  });

  it('stays open when a different contact is renamed', () => {
    const { commit, peek } = setup();
    commit(renameOpenedTopic('ep-1'));

    commit(contactRenamedTopic({ endpointId: 'ep-2', label: 'Laptop' }));

    expect(peek(renameStore).endpointId).toBe('ep-1');
  });
});
