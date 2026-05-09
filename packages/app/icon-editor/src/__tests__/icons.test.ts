import { encodeIconRef, parseIconRef } from '../icons';

describe('encodeIconRef', () => {
  it('joins pack and name with a colon — matches iconify convention', () => {
    expect(encodeIconRef({ pack: 'mdi', name: 'home' })).toBe('mdi:home');
  });

  it('returns the empty string when no icon is chosen — the URL-mirror effect treats that as "drop the param"', () => {
    expect(encodeIconRef(undefined)).toBe('');
  });
});

describe('parseIconRef', () => {
  it('splits the first colon — names with colons are unsupported anyway', () => {
    expect(parseIconRef('mdi:home')).toEqual({ pack: 'mdi', name: 'home' });
  });

  it('handles pack ids with hyphens', () => {
    expect(parseIconRef('material-symbols:check-circle')).toEqual({
      pack: 'material-symbols',
      name: 'check-circle',
    });
  });

  it('treats bare names as MDI — keeps pre-multipack `?icon=cog` URLs working', () => {
    expect(parseIconRef('cog')).toEqual({ pack: 'mdi', name: 'cog' });
  });

  it('returns `undefined` for malformed input — caller falls back to default', () => {
    expect(parseIconRef(':home')).toBeUndefined();
    expect(parseIconRef('mdi:')).toBeUndefined();
    expect(parseIconRef('')).toBeUndefined();
  });
});
