import { state } from '../../__tests__/fixtures';
import { initialDecisions } from '../../pipeline';
import { transformOrigin } from '../transform-origin';

describe('transformOrigin', () => {
  it('aims at the anchor on the facing edge', () => {
    const decisions = transformOrigin(
      state(),
      initialDecisions(state().placement),
    );
    // Anchor center x = 500, surface starts at 400 → 100px in, top edge.
    expect(decisions.transformOrigin).toBe('100px 0%');
  });

  it('flips the facing edge with the resolved side', () => {
    const decisions = transformOrigin(state(), {
      ...initialDecisions(state().placement),
      side: 'top',
    });
    expect(decisions.transformOrigin).toBe('100px 100%');
  });

  it('projects onto the vertical edge for horizontal sides', () => {
    const sideways = state({
      placement: {
        side: 'left',
        align: 'center',
        sideOffset: 0,
        alignOffset: 0,
      },
    });
    const decisions = transformOrigin(
      sideways,
      initialDecisions(sideways.placement),
    );
    expect(decisions.transformOrigin).toBe('100% 50px');
  });

  it('accounts for an earlier shift decision', () => {
    const decisions = transformOrigin(state(), {
      ...initialDecisions(state().placement),
      shiftX: 40,
    });
    expect(decisions.transformOrigin).toBe('60px 0%');
  });
});
