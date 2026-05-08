import { DEFAULT_ICON, encodeIconRef, parseIconRef } from '../icons';

describe('DEFAULT_ICON', () => {
  it('inlines a renderable body so the editor never starts blank', () => {
    expect(DEFAULT_ICON.pack).toBe('mdi');
    expect(DEFAULT_ICON.name).toBe('home');
    expect(DEFAULT_ICON.body).toContain('<path');
    expect(DEFAULT_ICON.width).toBe(24);
    expect(DEFAULT_ICON.height).toBe(24);
  });
});

describe('encodeIconRef', () => {
  it('joins pack and name with a colon — matches iconify convention', () => {
    expect(encodeIconRef({ pack: 'mdi', name: 'home' })).toBe('mdi:home');
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
