/**
 * Pointer arrow for the floating-ui primitive — the decorative triangle
 * that ties a floating surface back to its anchor. Kept a sibling of the
 * container so the surface chrome and its pointer stay independently
 * legible.
 */

/** Props for the floating primitive's pointer arrow. */
export interface ArrowProps {
  /** Triangle width, in px. Defaults to `12`. */
  width?: number;
  /** Triangle height, in px. Defaults to `6`. */
  height?: number;
  /**
   * CSS rotation applied to the triangle so it points at the anchor —
   * e.g. `'90deg'`. Defaults to `'0deg'` (points up).
   */
  rotate?: string;
  /** Class merged onto the arrow — e.g. a fill or shadow. */
  class?: string;
}

/**
 * Decorative triangle that ties a floating surface back to its anchor.
 * Sized by {@link ArrowProps.width} and {@link ArrowProps.height}, turned
 * by {@link ArrowProps.rotate}; fills with `currentColor` unless a
 * {@link ArrowProps.class} overrides it.
 */
export const Arrow = (props: ArrowProps) => {
  const width = () => props.width ?? 12;
  const height = () => props.height ?? 6;

  return (
    <svg
      width={width()}
      height={height()}
      viewBox={`0 0 ${width()} ${height()}`}
      class={props.class}
      style={{ transform: `rotate(${props.rotate ?? '0deg'})` }}
      aria-hidden="true"
    >
      <polygon
        points={`0,${height()} ${width()},${height()} ${width() / 2},0`}
        fill="currentColor"
      />
    </svg>
  );
};
