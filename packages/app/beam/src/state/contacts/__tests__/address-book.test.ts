/**
 * Unit tests for the address book's derived view: which name a contact ends
 * up wearing, when a name is ambiguous enough to need its key fragment, and
 * the order the list comes back in.
 */

import { createTestRuntime } from '@lib/state-next';
import { addressBookFormula } from '../address-book';
import { contactsRestoredTopic } from '../contacts';
import type { Contact } from '../database';
import { generateLabel } from '../../labels';
import { beamScope } from '../../scope';

const fakeContact = (overrides: Partial<Contact> = {}): Contact => ({
  endpointId: 'ep-1',
  label: null,
  suggestedLabel: null,
  trust: 'trusted',
  direction: 'outbound',
  createdAt: 1,
  lastSeenAt: 1,
  ...overrides,
});

const setup = (contacts: Contact[]) => {
  const runtime = createTestRuntime();
  runtime.anchor(beamScope);
  runtime.commit(contactsRestoredTopic(contacts));
  return runtime;
};

describe('addressBookFormula', () => {
  it('is empty before anything is paired', () => {
    const { peek } = setup([]);

    expect(peek(addressBookFormula)).toEqual([]);
  });

  it('prefers the local name over everything else', () => {
    const { peek } = setup([
      fakeContact({ label: 'Work phone', suggestedLabel: 'Kitchen tablet' }),
    ]);

    expect(peek(addressBookFormula)[0].name).toBe('Work phone');
  });

  it('falls back to the name the peer advertised', () => {
    const { peek } = setup([fakeContact({ suggestedLabel: 'Kitchen tablet' })]);

    expect(peek(addressBookFormula)[0].name).toBe('Kitchen tablet');
  });

  it('falls back to a name generated from the key', () => {
    const { peek } = setup([fakeContact({ endpointId: 'abcdef0123456789' })]);

    expect(peek(addressBookFormula)[0].name).toBe(
      generateLabel('abcdef0123456789'),
    );
  });

  it('caps a name a peer could otherwise run off the screen', () => {
    const { peek } = setup([fakeContact({ suggestedLabel: 'x'.repeat(500) })]);

    expect(peek(addressBookFormula)[0].name).toHaveLength(32);
  });

  it('leaves a name that stands on its own unambiguous', () => {
    const { peek } = setup([
      fakeContact({ endpointId: 'ep-1', label: 'Laptop' }),
      fakeContact({ endpointId: 'ep-2', label: 'Phone' }),
    ]);

    expect(peek(addressBookFormula).map((view) => view.ambiguous)).toEqual([
      false,
      false,
    ]);
  });

  it('flags every row sharing a name, so the fragment tells them apart', () => {
    const { peek } = setup([
      fakeContact({ endpointId: 'aaaaaaaa11', label: 'Laptop' }),
      fakeContact({ endpointId: 'bbbbbbbb22', label: 'Laptop' }),
      fakeContact({ endpointId: 'cccccccc33', label: 'Phone' }),
    ]);

    expect(peek(addressBookFormula)).toMatchObject([
      { name: 'Laptop', ambiguous: true, fragment: 'aaaaaa' },
      { name: 'Laptop', ambiguous: true, fragment: 'bbbbbb' },
      { name: 'Phone', ambiguous: false, fragment: 'cccccc' },
    ]);
  });

  it('sorts by name so the list holds still', () => {
    const { peek } = setup([
      fakeContact({ endpointId: 'ep-1', label: 'Zebra' }),
      fakeContact({ endpointId: 'ep-2', label: 'Apple' }),
      fakeContact({ endpointId: 'ep-3', label: 'Mango' }),
    ]);

    expect(peek(addressBookFormula).map((view) => view.name)).toEqual([
      'Apple',
      'Mango',
      'Zebra',
    ]);
  });

  it('breaks a tie on the endpoint id, which is unique', () => {
    const { peek } = setup([
      fakeContact({ endpointId: 'ep-2', label: 'Laptop' }),
      fakeContact({ endpointId: 'ep-1', label: 'Laptop' }),
    ]);

    expect(peek(addressBookFormula).map((view) => view.endpointId)).toEqual([
      'ep-1',
      'ep-2',
    ]);
  });

  it('carries the fields a row renders from', () => {
    const { peek } = setup([
      fakeContact({
        trust: 'invited',
        direction: 'inbound',
        createdAt: 10,
        lastSeenAt: 20,
      }),
    ]);

    expect(peek(addressBookFormula)[0]).toMatchObject({
      endpointId: 'ep-1',
      trust: 'invited',
      direction: 'inbound',
      createdAt: 10,
      lastSeenAt: 20,
    });
  });
});
