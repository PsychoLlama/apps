/**
 * Pointer arrow for the floating-ui primitive — the decorative triangle
 * that ties a floating surface back to its anchor. Kept a sibling of the
 * container so the surface chrome and its pointer stay independently
 * legible.
 */

/** Direction the arrow's point faces. */
export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

/** Props for the floating primitive's pointer arrow. */
export interface ArrowProps {
  /**
   * Length of the triangle's base — the edge that runs along the anchor.
   * In px. Defaults to `12`.
   */
  width?: number;
  /**
   * Depth the point protrudes from the base toward the anchor, in px.
   * Defaults to `6`.
   */
  height?: number;
  /** Direction the point faces. Defaults to `'up'`. */
  direction?: ArrowDirection;
  /** Class merged onto the arrow — e.g. a fill or shadow. */
  class?: string;
}

/**
 * Decorative triangle that ties a floating surface back to its anchor.
 * The base spans {@link ArrowProps.width} and the point protrudes
 * {@link ArrowProps.height} in the given {@link ArrowProps.direction};
 * fills with `currentColor` unless a {@link ArrowProps.class} overrides
 * it.
 *
 * The triangle is drawn directly for each direction rather than rotated,
 * so the SVG's intrinsic box always matches the shape — a left/right
 * arrow measures `height × width`, not `width × height` turned on its
 * side.
 */
export const Arrow = (props: ArrowProps) => {
  const base = () => props.width ?? 12;
  const depth = () => props.height ?? 6;
  const direction = () => props.direction ?? 'up';
  const horizontal = () => direction() === 'left' || direction() === 'right';

  // Horizontal arrows stand the base on its end, so the box swaps.
  const boxWidth = () => (horizontal() ? depth() : base());
  const boxHeight = () => (horizontal() ? base() : depth());

  const points = () => {
    const bw = boxWidth();
    const bh = boxHeight();
    switch (direction()) {
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

  return (
    <svg
      width={boxWidth()}
      height={boxHeight()}
      viewBox={`0 0 ${boxWidth()} ${boxHeight()}`}
      class={props.class}
      aria-hidden="true"
    >
      <polygon points={points()} fill="currentColor" />
    </svg>
  );
};
