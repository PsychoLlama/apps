import { rect, state } from '../../__tests__/fixtures';
import { initialDecisions } from '../../pipeline';
import { size } from '../size';

describe('size', () => {
  it('publishes the available space at the resolved placement', () => {
    const decisions = size(state(), initialDecisions(state().placement));
    expect(decisions.availableHeight).toBe(450);
    expect(decisions.availableWidth).toBe(1000);
  });

  it('accounts for padding and side offsets', () => {
    const padded = state({
      placement: {
        side: 'bottom',
        align: 'center',
        sideOffset: 10,
        alignOffset: 0,
      },
      padding: 8,
    });
    const decisions = size(padded, initialDecisions(padded.placement));
    expect(decisions.availableHeight).toBe(432);
    expect(decisions.availableWidth).toBe(984);
  });

  it('swaps axes for horizontal sides and never goes negative', () => {
    const cramped = state({
      placement: {
        side: 'right',
        align: 'center',
        sideOffset: 0,
        alignOffset: 0,
      },
      rects: { anchor: rect(950, 450, 100, 100) },
    });
    const decisions = size(cramped, initialDecisions(cramped.placement));
    expect(decisions.availableWidth).toBe(0);
    expect(decisions.availableHeight).toBe(1000);
  });

  it('measures the flipped side, not the requested one', () => {
    const flipped = size(state(), {
      ...initialDecisions(state().placement),
      side: 'top',
    });
    expect(flipped.availableHeight).toBe(450);
  });
});
