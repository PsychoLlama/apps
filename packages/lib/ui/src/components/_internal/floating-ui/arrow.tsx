import * as css from './arrow.css';

/**
 * Pointer arrow for the floating-ui primitive — the decorative triangle
 * that ties a floating surface back to its anchor. Kept a sibling of the
 * container so the surface chrome and its pointer stay independently
 * legible.
 */

/** Direction the arrow's point faces. */
export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

/** Placement of the arrow along the anchor edge it sits on. */
export type ArrowAlign = 'start' | 'center' | 'end';

/** Props for the floating primitive's pointer arrow. */
export interface ArrowProps {
  /** Direction the point faces. */
  direction: ArrowDirection;
  /**
   * Length of the triangle's base — the edge that runs along the anchor.
   * In px. Defaults to `12`.
   */
  base?: number;
  /**
   * Depth the point protrudes from the base toward the anchor, in px.
   * Defaults to `6`.
   */
  depth?: number;
  /**
   * Placement along the anchor edge, applied as `align-self` within the
   * container's arrow/body stack. Defaults to `'center'`.
   */
  align?: ArrowAlign;
  /** Class merged onto the arrow — e.g. a fill or shadow. */
  class?: string;
}

/**
 * Decorative triangle that ties a floating surface back to its anchor.
 * The base spans {@link ArrowProps.base} and the point protrudes
 * {@link ArrowProps.depth} in the given {@link ArrowProps.direction};
 * fills with `currentColor` unless a {@link ArrowProps.class} overrides
 * it.
 *
 * The triangle is drawn directly for each direction rather than rotated,
 * so the SVG's intrinsic box always matches the shape — a left/right
 * arrow measures `depth × base`, not `base × depth` turned on its side.
 */
export const Arrow = (props: ArrowProps) => {
  const base = () => props.base ?? 12;
  const depth = () => props.depth ?? 6;
  const horizontal = () =>
    props.direction === 'left' || props.direction === 'right';

  // Horizontal arrows stand the base on its end, so the box swaps.
  const boxWidth = () => (horizontal() ? depth() : base());
  const boxHeight = () => (horizontal() ? base() : depth());

  const points = () => {
    const bw = boxWidth();
    const bh = boxHeight();
    switch (props.direction) {
      case 'down':
        return `0,0 ${bw},0 ${bw / 2},${bh}`;
      case 'left':
        return `${bw},0 ${bw},${bh} 0,${bh / 2}`;
      case 'right':
        return `0,0 0,${bh} ${bw},${bh / 2}`;
      case 'up':
      default:
        return `0,${bh} ${bw},${bh} ${bw / 2},0`;
    }
  };

  const className = () => [css.arrow, props.class].filter(Boolean).join(' ');

  return (
    <svg
      width={boxWidth()}
      height={boxHeight()}
      viewBox={`0 0 ${boxWidth()} ${boxHeight()}`}
      class={className()}
      data-align={props.align ?? 'center'}
      aria-hidden="true"
    >
      <polygon points={points()} fill="currentColor" />
    </svg>
  );
};
