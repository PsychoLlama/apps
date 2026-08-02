/**
 * Unit tests for the address book's derived view: which name a contact ends
 * up wearing, and the order the list comes back in.
 */

import { createTestRuntime } from '@lib/state';
import { addressBookFormula } from '../directory';
import { contactsRestoredTopic } from '../contacts';
import type { Contact } from '../../platform/database';
import { generateLabel } from '../../labels';
import { beamScope } from '../../scope';

const fakeContact = (overrides: Partial<Contact> = {}): Contact => ({
  kind: 'peer',
  endpointId: 'ep-1',
  label: null,
  suggestedLabel: null,
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

  it('passes a name of any length through untouched', () => {
    const name = 'x'.repeat(500);
    const { peek } = setup([fakeContact({ label: name })]);

    // Length is the layout's problem, not the book's — the name is stored
    // locally and truncating it here would lie about what was typed.
    expect(peek(addressBookFormula)[0].name).toBe(name);
  });

  it('lets two contacts wear the same name', () => {
    const { peek } = setup([
      fakeContact({ endpointId: 'ep-1', label: 'Laptop' }),
      fakeContact({ endpointId: 'ep-2', label: 'Laptop' }),
    ]);

    expect(peek(addressBookFormula).map((view) => view.name)).toEqual([
      'Laptop',
      'Laptop',
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
    const { peek } = setup([fakeContact({ createdAt: 10 })]);

    expect(peek(addressBookFormula)[0]).toMatchObject({
      endpointId: 'ep-1',
      createdAt: 10,
    });
  });
});
