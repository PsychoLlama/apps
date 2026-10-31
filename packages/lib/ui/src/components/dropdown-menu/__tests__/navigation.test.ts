import { navigationTarget, nextTypeaheadMatch } from '../navigation';

describe('navigationTarget', () => {
  const items = ['a', 'b', 'c'].map((id) => {
    const element = document.createElement('div');
    element.id = id;
    return element;
  });
  const [first, second, third] = items;

  it('enters at either end from the surface', () => {
    expect(navigationTarget(items, null, 'ArrowDown')).toBe(first);
    expect(navigationTarget(items, null, 'Home')).toBe(first);
    expect(navigationTarget(items, null, 'ArrowUp')).toBe(third);
    expect(navigationTarget(items, null, 'End')).toBe(third);
  });

  it('steps between items without wrapping', () => {
    expect(navigationTarget(items, first, 'ArrowDown')).toBe(second);
    expect(navigationTarget(items, second, 'ArrowUp')).toBe(first);
    expect(navigationTarget(items, third, 'ArrowDown')).toBeUndefined();
    expect(navigationTarget(items, first, 'ArrowUp')).toBeUndefined();
  });

  it('jumps to the ends from an item', () => {
    expect(navigationTarget(items, second, 'Home')).toBe(first);
    expect(navigationTarget(items, second, 'PageUp')).toBe(first);
    expect(navigationTarget(items, second, 'End')).toBe(third);
    expect(navigationTarget(items, second, 'PageDown')).toBe(third);
  });

  it('ignores keys that do not navigate', () => {
    expect(navigationTarget(items, first, 'Enter')).toBeUndefined();
    expect(navigationTarget(items, null, 'x')).toBeUndefined();
  });
});

describe('nextTypeaheadMatch', () => {
  const values = ['Apple', 'Banana', 'Blueberry', 'Cherry'];

  it('matches a prefix, ignoring case', () => {
    expect(nextTypeaheadMatch(values, 'ap')).toBe(0);
    expect(nextTypeaheadMatch(values, 'ch')).toBe(3);
    expect(nextTypeaheadMatch(values, 'BLU')).toBe(2);
  });

  it('moves on from the current match on a single key', () => {
    expect(nextTypeaheadMatch(values, 'b', 1)).toBe(2);
    expect(nextTypeaheadMatch(values, 'b', 2)).toBe(1);
  });

  it('cycles on a repeated key', () => {
    expect(nextTypeaheadMatch(values, 'bb', 1)).toBe(2);
  });

  it('stays put while the current match still matches', () => {
    expect(nextTypeaheadMatch(values, 'ban', 1)).toBeUndefined();
  });

  it('reaches every item sharing a label', () => {
    const twins = ['Copy', 'Copy', 'Cut'];

    expect(nextTypeaheadMatch(twins, 'c', 0)).toBe(1);
    expect(nextTypeaheadMatch(twins, 'c', 1)).toBe(2);
  });

  it('finds nothing without a match', () => {
    expect(nextTypeaheadMatch(values, 'z')).toBeUndefined();
  });
});
