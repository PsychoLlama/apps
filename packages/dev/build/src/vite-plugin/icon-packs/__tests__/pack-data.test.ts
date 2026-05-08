import type { RawPackJson } from '../iconify.ts';
import { buildPackData, pickSamples } from '../pack-data.ts';

const makeRaw = (
  icons: RawPackJson['icons'],
  base?: { width?: number; height?: number },
): RawPackJson => ({
  prefix: 'demo',
  ...base,
  icons,
});

describe('buildPackData', () => {
  it('flattens icons in declaration order', () => {
    const raw = makeRaw({
      first: { body: '<a/>' },
      second: { body: '<b/>' },
      third: { body: '<c/>' },
    });

    const data = buildPackData(raw, 'demo', 'Demo');

    expect(data.icons.map((entry) => entry.name)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('drops hidden and body-less entries', () => {
    const raw = makeRaw({
      visible: { body: '<a/>' },
      hidden: { body: '<b/>', hidden: true },
      empty: { body: '' },
    });

    const data = buildPackData(raw, 'demo', 'Demo');

    expect(data.icons.map((entry) => entry.name)).toEqual(['visible']);
    expect(data.total).toBe(1);
  });

  it('falls back to width/height defaults when missing', () => {
    const raw = makeRaw({ a: { body: '<a/>' } });

    const data = buildPackData(raw, 'demo', 'Demo');

    expect(data.width).toBe(24);
    expect(data.height).toBe(24);
  });

  it('mirrors width to height when only one is set', () => {
    const wideOnly = buildPackData(makeRaw({}, { width: 32 }), 'demo', 'Demo');
    const tallOnly = buildPackData(makeRaw({}, { height: 48 }), 'demo', 'Demo');

    expect({ width: wideOnly.width, height: wideOnly.height }).toEqual({
      width: 32,
      height: 32,
    });
    expect({ width: tallOnly.width, height: tallOnly.height }).toEqual({
      width: 48,
      height: 48,
    });
  });

  it('keeps per-icon overrides only when they differ from the pack default', () => {
    const raw = makeRaw(
      {
        same: { body: '<a/>', width: 24, height: 24 },
        wider: { body: '<b/>', width: 32 },
        taller: { body: '<c/>', height: 48 },
      },
      { width: 24, height: 24 },
    );

    const data = buildPackData(raw, 'demo', 'Demo');
    const byName = new Map(data.icons.map((entry) => [entry.name, entry]));

    expect(byName.get('same')).toEqual({ name: 'same', body: '<a/>' });
    expect(byName.get('wider')).toEqual({
      name: 'wider',
      body: '<b/>',
      width: 32,
    });
    expect(byName.get('taller')).toEqual({
      name: 'taller',
      body: '<c/>',
      height: 48,
    });
  });
});

describe('pickSamples', () => {
  const icons = [
    { name: 'apple', body: '<a/>' },
    { name: 'banana', body: '<b/>' },
    { name: 'cherry', body: '<c/>' },
    { name: 'date', body: '<d/>' },
  ];

  it('honors the preferred order', () => {
    expect(
      pickSamples(icons, ['cherry', 'apple'], 5).map((entry) => entry.name),
    ).toEqual(['cherry', 'apple', 'banana', 'date']);
  });

  it('skips unknown preferred names', () => {
    expect(
      pickSamples(icons, ['ghost', 'banana'], 2).map((entry) => entry.name),
    ).toEqual(['banana', 'apple']);
  });

  it('fills from the front when no preferences are given', () => {
    expect(pickSamples(icons, undefined, 3).map((entry) => entry.name)).toEqual(
      ['apple', 'banana', 'cherry'],
    );
  });

  it('caps at the requested count', () => {
    expect(
      pickSamples(icons, ['apple', 'banana', 'cherry', 'date'], 2),
    ).toHaveLength(2);
  });

  it('returns at most as many icons as the pack contains', () => {
    expect(pickSamples(icons.slice(0, 2), undefined, 5)).toHaveLength(2);
  });
});
