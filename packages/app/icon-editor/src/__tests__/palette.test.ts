import { PALETTES, findPalette } from '../palette';

describe('PALETTES', () => {
  it('exposes all 25 chromatic Radix hues', () => {
    expect(PALETTES).toHaveLength(25);
  });

  it('pairs each entry with an opaque hex bg and a normalized hex fg', () => {
    for (const palette of PALETTES) {
      expect(palette.name).toMatch(/^[a-z]+$/);
      expect(palette.bg).toMatch(/^#[0-9a-f]{6,8}$/);
      expect(palette.fg).toMatch(/^#[0-9a-f]{6,8}$/);
    }
  });
});

describe('findPalette', () => {
  it('returns the entry matching the given name', () => {
    const blue = findPalette('blue');

    expect(blue).toBeDefined();
    expect(blue?.name).toBe('blue');
  });

  it('returns `undefined` for unknown names so callers can fall back', () => {
    expect(findPalette('mauvelous')).toBeUndefined();
  });
});
