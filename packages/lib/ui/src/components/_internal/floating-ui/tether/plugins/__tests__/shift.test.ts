import { rect, state } from '../../__tests__/fixtures';
import { initialDecisions } from '../../pipeline';
import { shift } from '../shift';

describe('shift', () => {
  it('does nothing when the surface fits', () => {
    const decisions = shift(state(), initialDecisions(state().placement));
    expect(decisions.shiftX).toBe(0);
    expect(decisions.shiftY).toBe(0);
  });

  it('slides the surface back into the viewport', () => {
    // Anchor near the left edge: a centered surface starts at -65.
    const near = state({ rects: { anchor: rect(10, 450, 50, 100) } });
    const decisions = shift(near, initialDecisions(near.placement));
    expect(decisions.shiftX).toBe(65);
    expect(decisions.shiftY).toBe(0);
  });

  it('honors edge padding', () => {
    const near = state({
      rects: { anchor: rect(10, 450, 50, 100) },
      padding: 8,
    });
    const decisions = shift(near, initialDecisions(near.placement));
    expect(decisions.shiftX).toBe(73);
  });

  it('stops shifting before the surface detaches from the anchor', () => {
    // The full correction (330) would push the surface's left edge past
    // the anchor's right edge; the limiter stops at their meeting point.
    const far = state({ rects: { anchor: rect(-255, 450, 50, 100) } });
    const decisions = shift(far, initialDecisions(far.placement));
    expect(decisions.shiftX).toBe(125);
  });

  it('shifts vertically for horizontal sides', () => {
    // Centered on a 50-tall anchor at y=10, the 100-tall surface
    // starts at -15; the correction slides it down to the edge.
    const near = state({
      placement: {
        side: 'right',
        align: 'center',
        sideOffset: 0,
        alignOffset: 0,
      },
      rects: { anchor: rect(450, 10, 100, 50) },
    });
    const decisions = shift(near, initialDecisions(near.placement));
    expect(decisions.shiftX).toBe(0);
    expect(decisions.shiftY).toBe(15);
  });
});
