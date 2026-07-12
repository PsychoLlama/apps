/**
 * Grace-area math: the "safe polygon" that lets a pointer travel from
 * a trigger to hoverable floating content (or from a submenu trigger
 * into its flyout) without the surface closing mid-journey. This is
 * half of WCAG 1.4.13's "hoverable" requirement; close delays are the
 * other half (see `hover-intent`).
 *
 * @see https://github.com/radix-ui/primitives/blob/main/packages/react/tooltip/src/tooltip.tsx
 * (`getExitSideFromRect`/`getHull`/`isPointInPolygon`)
 *
 * Deviations from Radix: none in the math — hull and hit-testing are
 * direct ports. Only pure functions live here; pointer tracking is
 * wired by consumers, who own the elements and events.
 */

/** A 2D point in viewport coordinates. */
export interface GracePoint {
  x: number;
  y: number;
}

/** An axis-aligned box, structurally compatible with `DOMRect`. */
export interface GraceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A convex region the pointer may cross without closing anything. */
export type GraceArea = readonly GracePoint[];

/** The four corners of a rect, optionally bled outward by `margin`. */
export const cornersOf = (rect: GraceRect, margin = 0): GracePoint[] => [
  { x: rect.x - margin, y: rect.y - margin },
  { x: rect.x + rect.width + margin, y: rect.y - margin },
  { x: rect.x + rect.width + margin, y: rect.y + rect.height + margin },
  { x: rect.x - margin, y: rect.y + rect.height + margin },
];

/**
 * Convex hull of a point set (Andrew's monotone chain). The grace area
 * between an exit point and a target rect is the hull of the exit
 * point and the rect's corners — the smallest convex region containing
 * every straight-line path from the pointer to the surface.
 */
export const getHull = (points: readonly GracePoint[]): GracePoint[] => {
  if (points.length <= 2) return [...points];

  const sorted = [...points].sort((one, two) => one.x - two.x || one.y - two.y);

  const cross = (
    origin: GracePoint,
    first: GracePoint,
    second: GracePoint,
  ): number =>
    (first.x - origin.x) * (second.y - origin.y) -
    (first.y - origin.y) * (second.x - origin.x);

  const chain = (input: readonly GracePoint[]): GracePoint[] => {
    const half: GracePoint[] = [];
    for (const point of input) {
      while (
        half.length >= 2 &&
        cross(half[half.length - 2], half[half.length - 1], point) <= 0
      ) {
        half.pop();
      }
      half.push(point);
    }
    // The last point begins the other half; drop it to avoid doubling.
    half.pop();
    return half;
  };

  return [...chain(sorted), ...chain([...sorted].reverse())];
};

/**
 * Ray-cast point-in-polygon test. Works for any simple polygon, convex
 * or not, so consumers can also test against hand-built regions.
 */
export const isPointInPolygon = (
  point: GracePoint,
  polygon: GraceArea,
): boolean => {
  let inside = false;

  for (
    let index = 0, previous = polygon.length - 1;
    index < polygon.length;
    previous = index++
  ) {
    const one = polygon[index];
    const two = polygon[previous];

    const crossesRay =
      one.y > point.y !== two.y > point.y &&
      point.x < ((two.x - one.x) * (point.y - one.y)) / (two.y - one.y) + one.x;
    if (crossesRay) inside = !inside;
  }

  return inside;
};

/**
 * Build the grace area between the pointer's exit point and the
 * surface it's traveling toward. `bleed` pads the surface (and the
 * exit point) so wobbling along an edge doesn't fall out of the area —
 * Radix uses 5px.
 */
export const buildGraceArea = (
  exit: GracePoint,
  target: GraceRect,
  bleed = 5,
): GraceArea =>
  getHull([
    { x: exit.x - bleed, y: exit.y - bleed },
    { x: exit.x + bleed, y: exit.y - bleed },
    { x: exit.x + bleed, y: exit.y + bleed },
    { x: exit.x - bleed, y: exit.y + bleed },
    ...cornersOf(target, bleed),
  ]);
