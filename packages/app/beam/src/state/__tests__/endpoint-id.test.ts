/**
 * Unit tests for endpoint address validation. The guarantee that matters is
 * that this agrees with the parser it stands in front of: every string iroh's
 * `EndpointId` parse refuses must be refused here too, because anything that
 * gets past becomes a persisted contact for a device that can never answer.
 *
 * The spellings below are the ones that parse was observed to reject —
 * `invalid length` for anything the wrong size, `failed to decode hex string`
 * for the right size in the wrong alphabet.
 */

import { isEndpointId } from '../endpoint-id';

/** A well-formed id: 32 bytes of key as lowercase hex. */
const VALID =
  '00a819dcd5a363167f44ed820e895eecea15156b3050a46a55041c55d2121b99';

describe('isEndpointId', () => {
  it('accepts a real endpoint id', () => {
    expect(isEndpointId(VALID)).toBe(true);
  });

  it('accepts any 64 lowercase hex characters', () => {
    expect(isEndpointId('0'.repeat(64))).toBe(true);
    expect(isEndpointId('f'.repeat(64))).toBe(true);
  });

  it('refuses a word someone typed into the URL bar', () => {
    expect(isEndpointId('bacon')).toBe(false);
  });

  it('refuses the empty path', () => {
    expect(isEndpointId('')).toBe(false);
  });

  it('refuses an id that is a character short or long', () => {
    expect(isEndpointId(VALID.slice(0, -1))).toBe(false);
    expect(isEndpointId(`${VALID}0`)).toBe(false);
  });

  it('refuses the uppercase spelling of a valid id', () => {
    // Not pedantry: iroh's parse fails this with `failed to decode hex
    // string`, so letting it through would record a contact the dial can
    // never reach — the exact shape of the bug this guards.
    expect(isEndpointId(VALID.toUpperCase())).toBe(false);
  });

  it('refuses hex with something that is not hex in it', () => {
    expect(isEndpointId(`${'0'.repeat(63)}g`)).toBe(false);
  });

  it('refuses an id padded with whitespace', () => {
    // The value arrives from a route param, so it is whatever was in the
    // path. Trimming here would accept a link the dial would not.
    expect(isEndpointId(` ${VALID}`)).toBe(false);
    expect(isEndpointId(`${VALID}\n`)).toBe(false);
  });

  it('is not fooled by a newline before a valid id', () => {
    // `$` is multiline-blind by default, but the pattern is unanchored-safe
    // only because it says so — worth a test, since a stray `m` flag or a
    // rewrite to `.search()` would quietly let this through.
    expect(isEndpointId(`bacon\n${VALID}`)).toBe(false);
  });
});
