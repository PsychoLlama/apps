import {
  rect,
  state,
  type TetherRects,
  type TetherState,
} from '../../__tests__/fixtures';
import { initialDecisions } from '../../pipeline';
import { arrow } from '../arrow';

describe('arrow', () => {
  // Arrow measured resting at the popup's center (rest center = 100
  // within the 200-wide surface at x=400).
  const withArrow = (
    overrides: Partial<Omit<TetherState, 'rects'>> & {
      rects?: Partial<TetherRects>;
    } = {},
  ) =>
    state({
      ...overrides,
      rects: { arrow: rect(494, 550, 12, 6), ...overrides.rects },
    });

  it('does nothing without an arrow', () => {
    const decisions = arrow(state(), initialDecisions(state().placement));
    expect(decisions.arrowShiftX).toBe(0);
    expect(decisions.arrowHidden).toBe(false);
  });

  it('holds identity while the measured placement is stale', () => {
    const flipped = withArrow();
    const decisions = arrow(flipped, {
      ...initialDecisions(flipped.placement),
      side: 'top',
    });
    expect(decisions.arrowShiftX).toBe(0);
    expect(decisions.arrowShiftY).toBe(0);
  });

  it('leaves a centered arrow alone when it already faces the anchor', () => {
    const centered = withArrow();
    const decisions = arrow(centered, initialDecisions(centered.placement));
    expect(decisions.arrowShiftX).toBe(0);
    expect(decisions.arrowHidden).toBe(false);
  });

  it('nudges the arrow onto the anchor center', () => {
    // Start-aligned surface: placed.x = 450, anchor center = 500 sits
    // 50px in; the arrow rests at the surface center (100px in).
    const aligned = withArrow({
      placement: {
        side: 'bottom',
        align: 'start',
        sideOffset: 0,
        alignOffset: 0,
      },
      rects: {
        popup: rect(450, 550, 200, 100),
        arrow: rect(544, 550, 12, 6),
      },
      applied: {
        side: 'bottom',
        align: 'start',
        arrowShiftX: 0,
        arrowShiftY: 0,
      },
    });
    const decisions = arrow(aligned, initialDecisions(aligned.placement));
    expect(decisions.arrowShiftX).toBe(-50);
    expect(decisions.arrowHidden).toBe(false);
  });

  it('normalizes its own previously applied nudge out of the measurement', () => {
    // Same layout as above, but the arrow was measured mid-nudge.
    const aligned = withArrow({
      placement: {
        side: 'bottom',
        align: 'start',
        sideOffset: 0,
        alignOffset: 0,
      },
      rects: {
        popup: rect(450, 550, 200, 100),
        arrow: rect(524, 550, 12, 6),
      },
      applied: {
        side: 'bottom',
        align: 'start',
        arrowShiftX: -20,
        arrowShiftY: 0,
      },
    });
    const decisions = arrow(aligned, initialDecisions(aligned.placement));
    expect(decisions.arrowShiftX).toBe(-50);
  });

  it('clamps the arrow to the surface and hides it past the edge', () => {
    // Anchor far to the right of a detach-limited surface: its center
    // (900) lies beyond the surface's right edge (650).
    const detached = withArrow({
      rects: {
        anchor: rect(850, 450, 100, 100),
        popup: rect(450, 550, 200, 100),
        arrow: rect(544, 550, 12, 6),
      },
      applied: {
        side: 'bottom',
        align: 'start',
        arrowShiftX: 0,
        arrowShiftY: 0,
      },
      placement: {
        side: 'bottom',
        align: 'start',
        sideOffset: 0,
        alignOffset: 0,
      },
    });
    // Force the placement basis the surface was measured under, with a
    // shift already decided by an earlier plugin.
    const decisions = arrow(detached, {
      ...initialDecisions(detached.placement),
      shiftX: -650, // pretend shift slid the surface far left
    });
    expect(decisions.arrowHidden).toBe(true);
  });

  it('works on the vertical axis for horizontal sides', () => {
    const sideways = withArrow({
      placement: {
        side: 'right',
        align: 'start',
        sideOffset: 0,
        alignOffset: 0,
      },
      rects: {
        popup: rect(550, 450, 200, 100),
        arrow: rect(550, 494, 6, 12),
      },
      applied: {
        side: 'right',
        align: 'start',
        arrowShiftX: 0,
        arrowShiftY: 0,
      },
    });
    const decisions = arrow(sideways, initialDecisions(sideways.placement));
    // Anchor center y = 500, surface starts at 450 → target 50; the
    // arrow rests at the surface's vertical center (50). Already there.
    expect(decisions.arrowShiftY).toBe(0);
  });
});
