/**
 * Unit tests for fallback endpoint names. The guarantee that matters is
 * determinism: two devices derive the same name for the same key without
 * exchanging anything, so the derivation can never depend on state, order, or
 * the clock.
 */

import { generateLabel } from '../labels';

describe('generateLabel', () => {
  it('takes the leading characters of the key', () => {
    expect(generateLabel('abcdef0123456789')).toBe('abcdef01');
  });

  it('gives the same key the same name every time', () => {
    expect(generateLabel('abcdef0123456789')).toBe(
      generateLabel('abcdef0123456789'),
    );
  });

  it('tells keys apart once they diverge inside the prefix', () => {
    expect(generateLabel('abcdef01ffff')).not.toBe(
      generateLabel('abcdef02ffff'),
    );
  });

  it('hands back a key shorter than the prefix whole', () => {
    expect(generateLabel('abc')).toBe('abc');
  });

  it('names the empty key rather than throwing', () => {
    expect(generateLabel('')).toBe('');
  });
});
