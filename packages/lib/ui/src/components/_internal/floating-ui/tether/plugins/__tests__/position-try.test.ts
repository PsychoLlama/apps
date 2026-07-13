import { rect, state } from '../../__tests__/fixtures';
import { initialDecisions } from '../../pipeline';
import { positionTry } from '../position-try';

describe('positionTry', () => {
  const flipToTop = positionTry([{ side: 'top' }]);

  it('keeps the requested placement when it fits', () => {
    const decisions = flipToTop(state(), initialDecisions(state().placement));
    expect(decisions.side).toBe('bottom');
    expect(decisions.align).toBe('center');
  });

  it('falls to the first fitting fallback', () => {
    // Anchor near the bottom: a below-surface clips the viewport.
    const near = state({ rects: { anchor: rect(450, 850, 100, 100) } });
    const decisions = flipToTop(near, initialDecisions(near.placement));
    expect(decisions.side).toBe('top');
  });

  it('walks the preference list in order', () => {
    // Too tall to fit above or below; the list carries it rightward.
    const cascade = positionTry([{ side: 'top' }, { side: 'right' }]);
    const cramped = state({
      rects: { popup: rect(0, 0, 200, 600) },
    });
    const decisions = cascade(cramped, initialDecisions(cramped.placement));
    expect(decisions.side).toBe('right');
  });

  it('shows the most surface when nothing fits', () => {
    // Overflows below, but above is even smaller.
    const cramped = state({
      rects: {
        anchor: rect(450, 20, 100, 100),
        popup: rect(0, 0, 200, 950),
      },
    });
    const decisions = flipToTop(cramped, initialDecisions(cramped.placement));
    expect(decisions.side).toBe('bottom');
  });

  it('respects edge padding when judging fit', () => {
    // Fits exactly without padding; padding pushes it over the line.
    const snug = state({ rects: { anchor: rect(450, 800, 100, 100) } });
    expect(flipToTop(snug, initialDecisions(snug.placement)).side).toBe(
      'bottom',
    );

    const padded = state({
      rects: { anchor: rect(450, 800, 100, 100) },
      padding: 8,
    });
    expect(flipToTop(padded, initialDecisions(padded.placement)).side).toBe(
      'top',
    );
  });

  it('falls back across horizontal sides too', () => {
    const near = state({
      placement: {
        side: 'right',
        align: 'center',
        sideOffset: 0,
        alignOffset: 0,
      },
      applied: {
        side: 'right',
        align: 'center',
        arrowShiftX: 0,
        arrowShiftY: 0,
      },
      rects: { anchor: rect(850, 450, 100, 100) },
    });
    const decisions = positionTry([{ side: 'left' }])(
      near,
      initialDecisions(near.placement),
    );
    expect(decisions.side).toBe('left');
  });

  it('supports alignment fallbacks along the same edge', () => {
    // Anchor near the right edge: centered overflows, end-aligned fits.
    const realign = positionTry([{ side: 'bottom', align: 'end' }]);
    const near = state({ rects: { anchor: rect(880, 450, 100, 100) } });
    const decisions = realign(near, initialDecisions(near.placement));
    expect(decisions.side).toBe('bottom');
    expect(decisions.align).toBe('end');
  });
});
