import { ICONS, ICON_VIEWBOX, findIcon } from '../icons';

describe('ICON_VIEWBOX', () => {
  it('matches the canonical MDI 24×24 grid', () => {
    expect(ICON_VIEWBOX).toEqual({ width: 24, height: 24 });
  });
});

describe('ICONS', () => {
  it('loads the MDI manifest — well into four-figure icon counts', () => {
    expect(ICONS.length).toBeGreaterThan(1000);
  });

  it('only ships entries with a non-empty body', () => {
    for (const icon of ICONS) {
      expect(icon.name.length).toBeGreaterThan(0);
      expect(icon.body.length).toBeGreaterThan(0);
    }
  });
});

describe('findIcon', () => {
  it('returns the entry matching the given name', () => {
    const home = findIcon('home');

    expect(home).toBeDefined();
    expect(home?.name).toBe('home');
    expect(home?.body).toContain('<path');
  });

  it('returns `undefined` for unknown names so callers can fall back', () => {
    expect(findIcon('totally-not-an-icon')).toBeUndefined();
  });
});
