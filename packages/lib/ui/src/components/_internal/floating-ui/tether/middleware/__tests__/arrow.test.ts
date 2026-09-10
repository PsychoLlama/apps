/**
 * Geometry tests for the arrow middleware.
 *
 * Runs the real `computePosition` pipeline — placement math, `offset`,
 * `shift` — with a platform that reports hand-built rects instead of
 * measuring the DOM. floating-ui ships no test utilities; overriding
 * `platform` is how its own core suite is driven, and it exercises the
 * coordinate space the middleware reads (`state.x` against
 * `rects.reference.x`) rather than assuming it.
 */

import {
  computePosition,
  offset,
  shift,
  type Dimensions,
  type Middleware,
  type Padding,
  type Placement,
  type Platform,
  type Rect,
} from '@floating-ui/dom';
import { arrow } from '../arrow';

/** The arrow's box: 12 along the edge, 6 deep, for a top/bottom side. */
const ARROW: Dimensions = { width: 12, height: 6 };

/** The subject is 80 along the edge, narrower than the 100-wide anchor. */
const SUBJECT: Dimensions = { width: 80, height: 40 };

/** The anchor: 100×100 at the origin of the offset parent. */
const ANCHOR: Rect = { x: 0, y: 0, width: 100, height: 100 };

/** A boundary big enough that `shift` never fires unless a test shrinks it. */
const BOUNDARY: Rect = { x: -1000, y: -1000, width: 3000, height: 3000 };

interface Scene {
  placement: Placement;
  anchor?: Rect;
  subject?: Dimensions;
  arrow?: Dimensions;
  /** The clipping boundary `shift` keeps the subject inside. */
  boundary?: Rect;
  padding?: Padding;
  /** Middleware to run before the arrow, e.g. `offset` or `shift`. */
  before?: Middleware[];
}

/**
 * Measure a scene through the real pipeline and return the arrow's
 * report alongside the subject's resolved position.
 */
const measure = async (scene: Scene) => {
  const reference = document.createElement('div');
  const floating = document.createElement('div');
  const element = document.createElement('svg');

  // The DOM build merges this over its own platform; only the measuring
  // calls are replaced. The option is typed as the whole platform, so
  // the partial is asserted.
  const platform: Partial<Platform> = {
    getElementRects: () => ({
      reference: scene.anchor ?? ANCHOR,
      floating: { x: 0, y: 0, ...(scene.subject ?? SUBJECT) },
    }),
    getDimensions: () => scene.arrow ?? ARROW,
    getClippingRect: () => scene.boundary ?? BOUNDARY,
  };

  const result = await computePosition(reference, floating, {
    placement: scene.placement,
    platform: platform as Platform,
    middleware: [
      ...(scene.before ?? []),
      arrow({ element, padding: scene.padding ?? 4 }),
    ],
  });

  return { x: result.x, y: result.y, data: result.middlewareData.arrow! };
};

describe('arrow', () => {
  it('takes the upstream name, so the two can never both run', () => {
    expect(arrow({ element: document.createElement('svg') }).name).toBe(
      'arrow',
    );
  });

  describe('given room', () => {
    it('seats a start-aligned arrow at the corner, inside the padding', async () => {
      const { x, data } = await measure({ placement: 'bottom-start' });
      expect(x).toBe(0);
      expect(data).toEqual({ x: 4, centerOffset: 0 });
    });

    it('centers a center-aligned arrow on the subject', async () => {
      const { x, data } = await measure({ placement: 'bottom' });
      expect(x).toBe(10);
      expect(data).toEqual({ x: (80 - 12) / 2, centerOffset: 0 });
    });

    it('seats an end-aligned arrow at the far corner, inside the padding', async () => {
      const { x, data } = await measure({ placement: 'bottom-end' });
      expect(x).toBe(20);
      expect(data).toEqual({ x: 80 - 4 - 12, centerOffset: 0 });
    });

    it('does not move for a subject nudged along the edge', async () => {
      // An alignOffset of 6 puts the subject's left edge inside the
      // anchor; the arrow's base is still fully over it.
      const { x, data } = await measure({
        placement: 'bottom-start',
        before: [offset({ alignmentAxis: 6 })],
      });
      expect(x).toBe(6);
      expect(data).toEqual({ x: 4, centerOffset: 0 });
    });

    it('reports the seat on the y axis for left/right sides', async () => {
      const tall = {
        subject: { width: 40, height: 80 },
        arrow: { width: 6, height: 12 },
      };

      const start = await measure({ placement: 'right-start', ...tall });
      expect(start.data).toEqual({ y: 4, centerOffset: 0 });

      const end = await measure({ placement: 'left-end', ...tall });
      expect(end.data).toEqual({ y: 80 - 4 - 12, centerOffset: 0 });
    });

    it('honors per-side padding', async () => {
      const { data } = await measure({
        placement: 'bottom-end',
        padding: { left: 2, right: 10 },
      });
      expect(data).toEqual({ x: 80 - 10 - 12, centerOffset: 0 });
    });
  });

  describe('after a shift', () => {
    it('slides a start-aligned arrow forward to the anchor', async () => {
      // The boundary ends 30px into the subject, so `shift` pushes it 50
      // left. The anchor now begins 50 in from the subject's left edge,
      // and the arrow's base lands on that edge — no further.
      const { x, data } = await measure({
        placement: 'bottom-start',
        boundary: { x: -1000, y: -1000, width: 1030, height: 3000 },
        before: [shift()],
      });
      expect(x).toBe(-50);
      expect(data).toEqual({ x: 50, centerOffset: 0 });
    });

    it('slides an end-aligned arrow back to the anchor', async () => {
      // The boundary starts 60px in, so `shift` pushes the subject 40
      // right of its end seat. The anchor ends 40 in from the subject's
      // left edge; the arrow's base ends there too.
      const { x, data } = await measure({
        placement: 'bottom-end',
        boundary: { x: 60, y: -1000, width: 3000, height: 3000 },
        before: [shift()],
      });
      expect(x).toBe(60);
      expect(data).toEqual({ x: 40 - 12, centerOffset: 0 });
    });

    it('slides a centered arrow only once its base leaves the anchor', async () => {
      // Pushed 30 right of its centered seat: the anchor still ends 60
      // in from the subject's left edge, past the arrow's base at 34–46.
      // Nothing to do.
      const near = await measure({
        placement: 'bottom',
        boundary: { x: 40, y: -1000, width: 3000, height: 3000 },
        before: [shift()],
      });
      expect(near.x).toBe(40);
      expect(near.data).toEqual({ x: 34, centerOffset: 0 });

      // Pushed 70: the anchor ends 20 in. The base slides back to end
      // there, and the padding floor is still clear.
      const far = await measure({
        placement: 'bottom',
        boundary: { x: 80, y: -1000, width: 3000, height: 3000 },
        before: [shift()],
      });
      expect(far.x).toBe(80);
      expect(far.data).toEqual({ x: 20 - 12, centerOffset: 0 });
    });
  });

  describe('when the anchor cannot hold the arrow', () => {
    it('reports the shortfall once the subject has slid clear of the anchor', async () => {
      // Pushed 200 right: the anchor spans −200…−100 in subject
      // coordinates. Nothing to point at.
      const { data } = await measure({
        placement: 'bottom-start',
        boundary: { x: 200, y: -1000, width: 3000, height: 3000 },
        before: [shift()],
      });
      expect(data.centerOffset).toBeGreaterThan(0);
    });

    it('reports the shortfall for an anchor narrower than the arrow', async () => {
      const { data } = await measure({
        placement: 'bottom-start',
        anchor: { x: 0, y: 0, width: 8, height: 100 },
      });
      expect(data.centerOffset).toBeGreaterThan(0);
    });

    it('reports the shortfall when the padding leaves no room', async () => {
      // The anchor spans the subject's first 12px, exactly the arrow's
      // base — but the corner padding pushes the seat past it.
      const edge: Rect = { x: 0, y: 0, width: 12, height: 100 };

      const padded = await measure({ placement: 'bottom-start', anchor: edge });
      expect(padded.data.centerOffset).toBe(4);

      // Without padding, it fits exactly.
      const flush = await measure({
        placement: 'bottom-start',
        anchor: edge,
        padding: 0,
      });
      expect(flush.data).toEqual({ x: 0, centerOffset: 0 });
    });

    it('reports the shortfall for a point reference', async () => {
      const { data } = await measure({
        placement: 'bottom-start',
        anchor: { x: 30, y: 70, width: 0, height: 0 },
      });
      expect(data.centerOffset).toBeGreaterThan(0);
    });

    it('still reports the alignment seat', async () => {
      // The arrow keeps its box, so the seat it would take is what the
      // window renders it at while hidden.
      const { data } = await measure({
        placement: 'bottom-end',
        boundary: { x: 200, y: -1000, width: 3000, height: 3000 },
        before: [shift()],
      });
      expect(data.x).toBe(80 - 4 - 12);
    });
  });
});
