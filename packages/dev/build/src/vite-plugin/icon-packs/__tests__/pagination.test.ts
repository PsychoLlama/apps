import type { IconEntry } from '../pack-data.ts';
import { pageStartOffsets, sliceIntoPages } from '../pagination.ts';

const tinyIcon = (name: string): IconEntry => ({ name, body: '<a/>' });
const fatIcon = (name: string, bodyLen: number): IconEntry => ({
  name,
  body: 'x'.repeat(bodyLen),
});

const buildList = (count: number, factory: (idx: number) => IconEntry) =>
  Array.from({ length: count }, (_unused, idx) => factory(idx));

describe('sliceIntoPages', () => {
  it('keeps everything in one page when the total fits the budget', () => {
    const icons = buildList(8, (idx) => tinyIcon(`icon-${idx}`));

    const pages = sliceIntoPages(icons, 10_000, 4);

    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(8);
  });

  it('splits when the budget is exceeded after the minimum is satisfied', () => {
    const icons = buildList(40, (idx) => fatIcon(`icon-${idx}`, 50));

    // ~70 bytes per entry × 40 ≈ 2.8 KB. Cap at 1 KB → ~14 entries per
    // page, but the floor lifts each page to 16.
    const pages = sliceIntoPages(icons, 1_000, 16);

    expect(pages.length).toBeGreaterThan(1);
    expect(pages.flat()).toHaveLength(40);
    for (const page of pages.slice(0, -1)) {
      expect(page.length).toBeGreaterThanOrEqual(16);
    }
  });

  it('honors the icon-count floor when a single icon already busts the budget', () => {
    const icons = buildList(20, (idx) => fatIcon(`icon-${idx}`, 5_000));

    // Each icon serializes to ~5 KB; budget is 1 KB. Without the
    // floor we'd emit 20 single-icon pages — the floor pushes each
    // page to 4 icons.
    const pages = sliceIntoPages(icons, 1_000, 4);

    for (const page of pages.slice(0, -1)) {
      expect(page.length).toBeGreaterThanOrEqual(4);
    }
    expect(pages.flat()).toHaveLength(20);
  });

  it('returns a single empty page for an empty input', () => {
    expect(sliceIntoPages([], 1_000, 16)).toEqual([[]]);
  });

  it('preserves icon order across pages', () => {
    const icons = buildList(50, (idx) => fatIcon(`icon-${idx}`, 100));
    const pages = sliceIntoPages(icons, 2_000, 16);

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
    const icons = buildList(30, (idx) => fatIcon(`icon-${idx}`, 200));
    const pages = sliceIntoPages(icons, 2_000, 8);

    const offsets = pageStartOffsets(pages);
    let cursor = 0;
    pages.forEach((page, index) => {
      expect(offsets[index]).toBe(cursor);
      cursor += page.length;
    });
  });
});
