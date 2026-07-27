/**
 * Unit tests for generated endpoint names. The guarantee that matters is
 * determinism: two devices derive the same name for the same key without
 * exchanging anything, so the derivation can never depend on state, order, or
 * the clock.
 */

import { generateLabel, keyFragment } from '../labels';

describe('generateLabel', () => {
  it('reads as a two-word name', () => {
    expect(generateLabel('ep-1')).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
  });

  it('gives the same key the same name every time', () => {
    expect(generateLabel('ep-1')).toBe(generateLabel('ep-1'));
  });

  it('tells different keys apart', () => {
    expect(generateLabel('ep-1')).not.toBe(generateLabel('ep-2'));
  });

  it('varies both words across the key space', () => {
    const keys = Array.from({ length: 200 }, (_unused, index) => `ep-${index}`);
    const names = keys.map(generateLabel);
    const adjectives = new Set(names.map((name) => name.split(' ')[0]));
    const nouns = new Set(names.map((name) => name.split(' ')[1]));

    // A single hash split into two fields would tie the noun's bits to the
    // adjective's and flatten one of these.
    expect(adjectives.size).toBeGreaterThan(20);
    expect(nouns.size).toBeGreaterThan(20);
  });

  it('names the empty key rather than throwing', () => {
    expect(generateLabel('')).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
  });
});

describe('keyFragment', () => {
  it('takes the leading characters of the key', () => {
    expect(keyFragment('abcdef0123456789')).toBe('abcdef');
  });

  it('hands back a short key whole', () => {
    expect(keyFragment('abc')).toBe('abc');
  });
});
