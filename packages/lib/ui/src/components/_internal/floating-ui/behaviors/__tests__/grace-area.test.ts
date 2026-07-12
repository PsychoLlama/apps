import {
  buildGraceArea,
  cornersOf,
  getHull,
  isPointInPolygon,
  type GracePoint,
} from '../grace-area';

const point = (across: number, down: number): GracePoint => ({
  x: across,
  y: down,
});

describe('cornersOf', () => {
  it('returns the four corners, optionally bled outward', () => {
    const rect = { x: 10, y: 20, width: 100, height: 50 };

    expect(cornersOf(rect)).toEqual([
      point(10, 20),
      point(110, 20),
      point(110, 70),
      point(10, 70),
    ]);
    expect(cornersOf(rect, 5)).toEqual([
      point(5, 15),
      point(115, 15),
      point(115, 75),
      point(5, 75),
    ]);
  });
});

describe('getHull', () => {
  it('drops interior points', () => {
    const square = [point(0, 0), point(10, 0), point(10, 10), point(0, 10)];
    const hull = getHull([...square, point(5, 5)]);

    expect(hull).toHaveLength(4);
    expect(hull).toEqual(expect.arrayContaining(square));
  });

  it('keeps a protruding point', () => {
    const square = [point(0, 0), point(10, 0), point(10, 10), point(0, 10)];
    const apex = point(20, 5);
    const hull = getHull([...square, apex]);

    expect(hull).toContainEqual(apex);
  });

  it('passes tiny sets through untouched', () => {
    const pair = [point(0, 0), point(5, 5)];
    expect(getHull(pair)).toEqual(pair);
  });
});

describe('isPointInPolygon', () => {
  const square = [point(0, 0), point(10, 0), point(10, 10), point(0, 10)];

  it('detects containment', () => {
    expect(isPointInPolygon(point(5, 5), square)).toBe(true);
    expect(isPointInPolygon(point(15, 5), square)).toBe(false);
    expect(isPointInPolygon(point(5, -1), square)).toBe(false);
  });
});

describe('buildGraceArea', () => {
  it('covers the straight path from the exit point to the surface', () => {
    // Pointer leaves at (0, 50); the surface sits to the right.
    const area = buildGraceArea(point(0, 50), {
      x: 100,
      y: 0,
      width: 50,
      height: 100,
    });

    // Milestones along the diagonal journeys stay inside...
    expect(isPointInPolygon(point(50, 50), area)).toBe(true);
    expect(isPointInPolygon(point(90, 30), area)).toBe(true);
    expect(isPointInPolygon(point(125, 50), area)).toBe(true);

    // ...while points behind the exit or far off-path are out.
    expect(isPointInPolygon(point(-20, 50), area)).toBe(false);
    expect(isPointInPolygon(point(20, 110), area)).toBe(false);
  });

  it('bleeds the area so edge-wobble stays inside', () => {
    const area = buildGraceArea(
      point(0, 50),
      { x: 100, y: 0, width: 50, height: 100 },
      5,
    );

    // Just outside the surface's literal edge, inside the bleed.
    expect(isPointInPolygon(point(153, 50), area)).toBe(true);
    expect(isPointInPolygon(point(160, 50), area)).toBe(false);
  });
});
