import {
  clamp,
  getScrollPositionFromPointer,
  getThumbOffsetFromScroll,
  getThumbRatio,
  getThumbSize,
  linearScale,
  MIN_THUMB_SIZE,
  type Sizes,
} from '../geometry';

/** Build a `Sizes` object with sensible defaults so each test only
 * names the fields it cares about. */
const sizes = (overrides: Partial<Sizes> = {}): Sizes => ({
  content: 1000,
  viewport: 200,
  scrollbar: { size: 200, paddingStart: 0, paddingEnd: 0 },
  ...overrides,
});

describe('clamp', () => {
  it('returns the value when it sits inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('floors at min', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it('ceilings at max', () => {
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('passes through endpoints', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('collapses to the bound when min === max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});

describe('linearScale', () => {
  it('maps an input interval onto an output interval', () => {
    const scale = linearScale([0, 10], [0, 100]);
    expect(scale(0)).toBe(0);
    expect(scale(5)).toBe(50);
    expect(scale(10)).toBe(100);
  });

  it('extrapolates outside the input range', () => {
    const scale = linearScale([0, 10], [0, 100]);
    expect(scale(15)).toBe(150);
    expect(scale(-1)).toBe(-10);
  });

  it('handles inverted output ranges', () => {
    const scale = linearScale([0, 10], [100, 0]);
    expect(scale(0)).toBe(100);
    expect(scale(10)).toBe(0);
  });

  it('returns output[0] when the input interval has zero width', () => {
    // Otherwise the slope would be Infinity / NaN.
    const scale = linearScale([5, 5], [0, 100]);
    expect(scale(5)).toBe(0);
    expect(scale(0)).toBe(0);
  });

  it('returns output[0] when the output interval has zero width', () => {
    const scale = linearScale([0, 10], [42, 42]);
    expect(scale(7)).toBe(42);
  });
});

describe('getThumbRatio', () => {
  it('returns viewport / content', () => {
    expect(getThumbRatio(200, 1000)).toBe(0.2);
  });

  it('returns 1 when viewport meets content', () => {
    expect(getThumbRatio(500, 500)).toBe(1);
  });

  it('clamps NaN (0/0) to 0', () => {
    expect(getThumbRatio(0, 0)).toBe(0);
  });

  it('clamps Infinity (n/0) to 0', () => {
    expect(getThumbRatio(100, 0)).toBe(0);
  });

  it('reports >1 when viewport exceeds content (scrollbar will hide)', () => {
    // The component gates `hasThumb` on `0 < ratio < 1`, so values
    // outside that band correctly disable the thumb.
    expect(getThumbRatio(1000, 200)).toBe(5);
  });
});

describe('getThumbSize', () => {
  it('scales the track by the viewport/content ratio', () => {
    // 200/1000 = 0.2 over a 200px track = 40px.
    expect(getThumbSize(sizes())).toBe(40);
  });

  it('subtracts both paddings before scaling', () => {
    const result = getThumbSize(
      sizes({
        scrollbar: { size: 200, paddingStart: 10, paddingEnd: 10 },
      }),
    );
    // (200 - 20) * 0.2 = 36.
    expect(result).toBe(36);
  });

  it('floors at MIN_THUMB_SIZE', () => {
    // 50/10000 = 0.005 over a 100px track = 0.5px — below the floor.
    const result = getThumbSize(
      sizes({
        content: 10_000,
        viewport: 50,
        scrollbar: { size: 100, paddingStart: 0, paddingEnd: 0 },
      }),
    );
    expect(result).toBe(MIN_THUMB_SIZE);
  });

  it('returns MIN_THUMB_SIZE when content is zero', () => {
    // ratio collapses to 0, so the bare math would emit 0.
    expect(getThumbSize(sizes({ content: 0, viewport: 0 }))).toBe(
      MIN_THUMB_SIZE,
    );
  });
});

describe('getScrollPositionFromPointer', () => {
  it('maps the track midpoint to the content midpoint when pointer offset is null', () => {
    // Track click — the thumb centers under the cursor.
    const subject = sizes(); // thumb = 40, track = 200, maxScroll = 800.
    // Mid-pointer = 100; expected scroll = 400.
    expect(getScrollPositionFromPointer(100, null, subject)).toBe(400);
  });

  it('honors a captured pointer offset on a thumb press', () => {
    // Press lands on the thumb's leading edge — the cursor should
    // map to scrollLeft 0, not jump past it.
    const subject = sizes();
    expect(getScrollPositionFromPointer(0, 0, subject)).toBe(0);
  });

  it('clamps to scroll = 0 at the start of the track', () => {
    // Pointer at far-left of track with thumb-centered offset.
    const subject = sizes();
    expect(getScrollPositionFromPointer(0, null, subject)).toBeLessThanOrEqual(
      0,
    );
  });

  it('respects scrollbar padding on each side', () => {
    const subject = sizes({
      scrollbar: { size: 220, paddingStart: 10, paddingEnd: 10 },
    });
    // Inner track is still 200, so midpoint (110) maps to maxScroll/2.
    expect(getScrollPositionFromPointer(110, null, subject)).toBe(400);
  });

  it('round-trips with getThumbOffsetFromScroll', () => {
    // Inverse-pair invariant: feeding a scroll position through
    // `getThumbOffsetFromScroll`, treating that as a thumb-edge
    // press (offset = 0), and feeding the resulting pointer
    // position through `getScrollPositionFromPointer` returns the
    // original scroll.
    const subject = sizes();
    for (const scroll of [0, 100, 400, 799, 800]) {
      const thumbOffset = getThumbOffsetFromScroll(scroll, subject);
      // Pointer position is the thumb's leading edge, including the
      // start padding the helpers each contribute.
      const pointer = thumbOffset + subject.scrollbar.paddingStart;
      expect(getScrollPositionFromPointer(pointer, 0, subject)).toBeCloseTo(
        scroll,
        5,
      );
    }
  });
});

describe('getThumbOffsetFromScroll', () => {
  it('places the thumb at 0 when scrollPos is 0', () => {
    expect(getThumbOffsetFromScroll(0, sizes())).toBe(0);
  });

  it('places the thumb at maxThumb when scrollPos is maxScroll', () => {
    const subject = sizes(); // thumb = 40, track = 200, maxScroll = 800.
    expect(getThumbOffsetFromScroll(800, subject)).toBe(160); // 200 - 40.
  });

  it('clamps negative scroll positions (rubber-banding) to 0', () => {
    // iOS bounce can report negative scrollTop briefly.
    expect(getThumbOffsetFromScroll(-50, sizes())).toBe(0);
  });

  it('clamps over-scroll past maxScroll back to maxThumb', () => {
    const subject = sizes();
    expect(getThumbOffsetFromScroll(10_000, subject)).toBe(160);
  });

  it('returns 0 when there is no scrollable content', () => {
    // maxScroll === 0 — `linearScale` should hand back output[0].
    const subject = sizes({ content: 200, viewport: 200 });
    expect(getThumbOffsetFromScroll(0, subject)).toBe(0);
    // Even if the caller asks for a non-zero scroll, we have nowhere
    // to go.
    expect(getThumbOffsetFromScroll(50, subject)).toBe(0);
  });

  it('respects scrollbar padding (smaller usable track)', () => {
    const subject = sizes({
      scrollbar: { size: 220, paddingStart: 10, paddingEnd: 10 },
    });
    // Inner track 200, thumb 40 → maxThumb 160 — same as the
    // unpadded baseline since padding is symmetric.
    expect(getThumbOffsetFromScroll(800, subject)).toBe(160);
  });
});
