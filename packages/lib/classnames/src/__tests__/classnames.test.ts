import { clx } from '../classnames';

describe('clx', () => {
  it('joins class names with a space', () => {
    expect(clx('one', 'two', 'three')).toBe('one two three');
  });

  it('returns the only class name it was given', () => {
    expect(clx('one')).toBe('one');
  });

  it('skips falsy values', () => {
    expect(clx('one', false, 0, null, undefined, '', 'two')).toBe('one two');
  });

  it('drops a zero-length guard instead of rendering it', () => {
    const items: string[] = [];

    expect(clx('list', items.length && 'list--filled')).toBe('list');
  });

  it('never emits a leading, trailing, or doubled separator', () => {
    expect(clx(false, 'one', undefined, 'two', null)).toBe('one two');
  });

  it('returns an empty string when everything is falsy', () => {
    expect(clx(false, 0, null, undefined, '')).toBe('');
  });

  it('preserves duplicate class names', () => {
    expect(clx('one', 'one')).toBe('one one');
  });

  it('preserves the order it was given', () => {
    expect(clx('base', ['size'], 'override')).toBe('base size override');
  });

  describe('arrays', () => {
    it('flattens a list of class names', () => {
      expect(clx(['one', 'two'], 'three')).toBe('one two three');
    });

    it('skips falsy values inside the list', () => {
      expect(clx(['one', false, 0, null, undefined, '', 'two'])).toBe(
        'one two',
      );
    });

    it('ignores an empty list', () => {
      expect(clx([], 'one')).toBe('one');
    });
  });
});
