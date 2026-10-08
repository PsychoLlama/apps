import type { IconEntry } from '../pack-data.ts';
import { pageStartOffsets, sliceIntoPages } from '../pagination.ts';

const tinyIcon = (name: string): IconEntry => ({ name, body: '<a/>' });

const buildList = (count: number, factory: (idx: number) => IconEntry) =>
  Array.from({ length: count }, (_unused, idx) => factory(idx));

describe('sliceIntoPages', () => {
  it('keeps everything in one page when the total fits the page size', () => {
    const icons = buildList(8, (idx) => tinyIcon(`icon-${idx}`));

    const pages = sliceIntoPages(icons, 500);

    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(8);
  });

  it('splits into fixed-count pages when the total exceeds the page size', () => {
    const icons = buildList(1100, (idx) => tinyIcon(`icon-${idx}`));

    const pages = sliceIntoPages(icons, 500);

    expect(pages.map((page) => page.length)).toEqual([500, 500, 100]);
    expect(pages.flat()).toHaveLength(1100);
  });

  it('returns a single empty page for an empty input', () => {
    expect(sliceIntoPages([], 500)).toEqual([[]]);
  });

  it('preserves icon order across pages', () => {
    const icons = buildList(50, (idx) => tinyIcon(`icon-${idx}`));
    const pages = sliceIntoPages(icons, 16);

    const flattened = pages.flat().map((entry) => entry.name);
    const original = icons.map((entry) => entry.name);
    expect(flattened).toEqual(original);
  });
});

describe('pageStartOffsets', () => {
  it('returns the cumulative starting index of each page', () => {
    const pages: IconEntry[][] = [
      [tinyIcon('a'), tinyIcon('b'), tinyIcon('c')],
      [tinyIcon('d'), tinyIcon('e')],
      [tinyIcon('f')],
    ];

    expect(pageStartOffsets(pages)).toEqual([0, 3, 5]);
  });

  it('handles empty pages gracefully', () => {
    expect(pageStartOffsets([[]])).toEqual([0]);
  });

  it('matches what `sliceIntoPages` would produce', () => {
    const icons = buildList(30, (idx) => tinyIcon(`icon-${idx}`));
    const pages = sliceIntoPages(icons, 8);

    const offsets = pageStartOffsets(pages);
    let cursor = 0;
    pages.forEach((page, index) => {
      expect(offsets[index]).toBe(cursor);
      cursor += page.length;
    });
  });
});
