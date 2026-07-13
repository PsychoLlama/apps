/**
 * The decision fold itself: plugins run left-to-right so each sees the
 * decisions made before it. The individual plugins are covered in
 * isolation under `../plugins/__tests__`; this exercises the wiring.
 */

import { initialDecisions, runTether } from '../pipeline';
import { arrow, positionTry, shift, size } from '../plugins';
import { rect, state } from './fixtures';

describe('runTether', () => {
  it('reproduces the pure-CSS placement with no plugins', () => {
    const decisions = runTether(state(), []);
    expect(decisions).toEqual(initialDecisions(state().placement));
  });

  it('folds left so later plugins see earlier decisions', () => {
    const near = state({ rects: { anchor: rect(450, 850, 100, 100) } });
    const decisions = runTether(near, [positionTry([{ side: 'top' }]), size]);

    // size measured the flipped side's gap, not the requested one.
    expect(decisions.side).toBe('top');
    expect(decisions.availableHeight).toBe(850);
  });

  it('holds the arrow while a flip invalidates its measurement', () => {
    const near = state({
      rects: {
        anchor: rect(450, 850, 100, 100),
        arrow: rect(494, 550, 12, 6),
      },
    });
    const decisions = runTether(near, [
      positionTry([{ side: 'top' }]),
      shift,
      size,
      arrow,
    ]);

    expect(decisions.side).toBe('top');
    expect(decisions.arrowShiftX).toBe(0);
  });
});
