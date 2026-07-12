import { createRoot } from 'solid-js';
import { createTypeahead, getNextMatch } from '../typeahead';

const LABELS = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry'];

describe('getNextMatch', () => {
  it('matches by case-insensitive prefix', () => {
    expect(getNextMatch(LABELS, 'ba', undefined)).toBe('Banana');
    expect(getNextMatch(LABELS, 'BLUE', undefined)).toBe('Blueberry');
  });

  it('searches forward from the current item, wrapping around', () => {
    expect(getNextMatch(LABELS, 'a', 'Apple')).toBe('Apricot');
    expect(getNextMatch(LABELS, 'b', 'Cherry')).toBe('Banana');
  });

  it('cycles items sharing an initial on repeated presses', () => {
    // "aa" reads as "next thing starting with a", not a literal "aa".
    expect(getNextMatch(LABELS, 'aa', 'Apricot')).toBe('Apple');
  });

  it('excludes the current item on single-character queries', () => {
    expect(getNextMatch(['Apple'], 'a', 'Apple')).toBeUndefined();
  });

  it('keeps the current item eligible for grown queries', () => {
    expect(getNextMatch(LABELS, 'apr', 'Apricot')).toBe('Apricot');
  });

  it('returns undefined when nothing matches', () => {
    expect(getNextMatch(LABELS, 'zz', undefined)).toBeUndefined();
  });
});

describe('createTypeahead', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mount = () =>
    createRoot((dispose) => ({ typeahead: createTypeahead(), dispose }));

  it('buffers keystrokes into one growing query', () => {
    const { typeahead, dispose } = mount();

    expect(typeahead.search('b', LABELS, undefined)).toBe('Banana');
    // The buffer is now "bl" — a different match than a fresh "l".
    expect(typeahead.search('l', LABELS, undefined)).toBe('Blueberry');

    dispose();
  });

  it('reports whether a search is in flight', () => {
    const { typeahead, dispose } = mount();

    expect(typeahead.searching()).toBe(false);
    typeahead.search('b', LABELS, undefined);
    expect(typeahead.searching()).toBe(true);

    dispose();
  });

  it('resets the buffer after a second of silence', () => {
    const { typeahead, dispose } = mount();

    typeahead.search('b', LABELS, undefined);
    vi.advanceTimersByTime(1000);
    expect(typeahead.searching()).toBe(false);

    // A fresh "a" matches from the top instead of extending "b".
    expect(typeahead.search('a', LABELS, undefined)).toBe('Apple');

    dispose();
  });

  it('resets on demand', () => {
    const { typeahead, dispose } = mount();

    typeahead.search('b', LABELS, undefined);
    typeahead.reset();
    expect(typeahead.searching()).toBe(false);

    dispose();
  });
});
