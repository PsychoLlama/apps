import { rovingKeyTarget, type RovingKeyContext } from '../roving-focus';

const context = (
  overrides: Partial<RovingKeyContext> = {},
): RovingKeyContext => ({
  count: 4,
  current: 1,
  orientation: 'vertical',
  ...overrides,
});

describe('rovingKeyTarget', () => {
  it('steps along the primary axis', () => {
    expect(rovingKeyTarget('ArrowDown', context())).toBe(2);
    expect(rovingKeyTarget('ArrowUp', context())).toBe(0);

    const horizontal = context({ orientation: 'horizontal' });
    expect(rovingKeyTarget('ArrowRight', horizontal)).toBe(2);
    expect(rovingKeyTarget('ArrowLeft', horizontal)).toBe(0);
  });

  it('ignores the cross axis', () => {
    expect(rovingKeyTarget('ArrowRight', context())).toBeNull();
    expect(
      rovingKeyTarget('ArrowDown', context({ orientation: 'horizontal' })),
    ).toBeNull();
  });

  it('jumps to the ends with Home/End and their paging twins', () => {
    expect(rovingKeyTarget('Home', context())).toBe(0);
    expect(rovingKeyTarget('PageUp', context())).toBe(0);
    expect(rovingKeyTarget('End', context())).toBe(3);
    expect(rovingKeyTarget('PageDown', context())).toBe(3);
  });

  it('loops at the edges by default and clamps when disabled', () => {
    expect(rovingKeyTarget('ArrowDown', context({ current: 3 }))).toBe(0);
    expect(rovingKeyTarget('ArrowUp', context({ current: 0 }))).toBe(3);

    expect(
      rovingKeyTarget('ArrowDown', context({ current: 3, loop: false })),
    ).toBe(3);
    expect(
      rovingKeyTarget('ArrowUp', context({ current: 0, loop: false })),
    ).toBe(0);
  });

  it('declines keys the composite does not own', () => {
    expect(rovingKeyTarget('Enter', context())).toBeNull();
    expect(rovingKeyTarget('a', context())).toBeNull();
  });

  it('declines everything for an empty composite', () => {
    expect(rovingKeyTarget('ArrowDown', context({ count: 0 }))).toBeNull();
    expect(rovingKeyTarget('Home', context({ count: 0 }))).toBeNull();
  });
});
