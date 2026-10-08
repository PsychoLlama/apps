import {
  REF_PLACEHOLDER_MARKER,
  createPlaceholderTable,
} from '../placeholders.ts';

describe('createPlaceholderTable', () => {
  it('mints unique placeholders that round-trip through replaceRefs', () => {
    const table = createPlaceholderTable();
    const first = table.allocate('ref-a');
    const second = table.allocate('ref-b');

    expect(first).not.toBe(second);

    const text = `before ${first} mid ${second} end`;
    const resolved = table.replaceRefs(text, (ref) => `URL(${ref})`);

    expect(resolved).toBe('before URL(ref-a) mid URL(ref-b) end');
  });

  it('replaces every occurrence of the same placeholder', () => {
    const table = createPlaceholderTable();
    const placeholder = table.allocate('shared');

    const text = `${placeholder} and ${placeholder} and ${placeholder}`;
    const resolved = table.replaceRefs(text, () => 'X');

    expect(resolved).toBe('X and X and X');
  });

  it('is a no-op when the marker is absent', () => {
    const table = createPlaceholderTable();
    table.allocate('ref-a');

    const calls: string[] = [];
    const text = 'no markers here';
    const resolved = table.replaceRefs(text, (ref) => {
      calls.push(ref);
      return 'URL';
    });

    expect(resolved).toBe(text);
    expect(calls).toEqual([]);
  });

  it('emits placeholders that contain the shared marker prefix', () => {
    const table = createPlaceholderTable();

    expect(table.allocate('ref').startsWith(REF_PLACEHOLDER_MARKER)).toBe(true);
  });

  it('keeps each table independent', () => {
    const left = createPlaceholderTable();
    const right = createPlaceholderTable();

    const leftPlaceholder = left.allocate('left-ref');
    const text = `before ${leftPlaceholder} after`;

    // `right` doesn't know about `leftPlaceholder` so it leaves it untouched.
    expect(right.replaceRefs(text, () => 'X')).toBe(text);
    expect(left.replaceRefs(text, () => 'X')).toBe('before X after');
  });
});
