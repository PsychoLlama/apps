import { formatHeaders } from '../format.ts';

describe('formatHeaders', () => {
  it('renders a pattern followed by its indented headers', () => {
    expect(
      formatHeaders([
        { pattern: '/_build/*', headers: { 'Cache-Control': 'immutable' } },
      ]),
    ).toBe('/_build/*\n  Cache-Control: immutable\n');
  });

  it('merges rules with the same pattern where it first appears', () => {
    expect(
      formatHeaders([
        { pattern: '/a', headers: { 'X-One': '1' } },
        { pattern: '/b', headers: { 'X-Two': '2' } },
        { pattern: '/a', headers: { 'X-Three': '3', 'X-Four': '4' } },
      ]),
    ).toBe(
      [
        '/a',
        '  X-One: 1',
        '  X-Three: 3',
        '  X-Four: 4',
        '',
        '/b',
        '  X-Two: 2',
        '',
      ].join('\n'),
    );
  });
});
