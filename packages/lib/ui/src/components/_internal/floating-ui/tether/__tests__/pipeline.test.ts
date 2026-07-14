/**
 * The decision fold itself: plugins run left-to-right so each sees the
 * decisions made before it. The individual plugins are covered in
 * isolation under `../plugins/__tests__`; this exercises the wiring.
 */

import { initialDecisions, runTether } from '../pipeline';
import { positionTry } from '../plugins';
import { rect, state } from './fixtures';

describe('runTether', () => {
  it('reproduces the pure-CSS placement with no plugins', () => {
    const decisions = runTether(state(), []);
    expect(decisions).toEqual(initialDecisions(state().placement));
  });

  it('folds left so later plugins see earlier decisions', () => {
    // Anchor near the bottom: the first stage flips the surface above.
    // The second stage pins to whatever's decided (empty fallback), so
    // it can only report 'top' if it saw the first stage's choice.
    const near = state({ rects: { anchor: rect(450, 850, 100, 100) } });
    const decisions = runTether(near, [
      positionTry([{ side: 'top' }]),
      positionTry([]),
    ]);

    expect(decisions.side).toBe('top');
  });
});
