/**
 * Tests for the boxes middleware.
 *
 * Same harness as the arrow suite: the real `computePosition` pipeline
 * with a platform reporting hand-built rects. What's worth testing isn't
 * the forwarding — it's the two coordinate spaces, which are the whole
 * reason to read the report instead of measuring: that boxes in the same
 * space subtract, that the viewport pair is the platform's answer rather
 * than arithmetic of our own, and that a platform which can't convert
 * says so instead of answering in the wrong space.
 */

import {
  computePosition,
  offset,
  shift,
  type Dimensions,
  type Middleware,
  type MiddlewareState,
  type Placement,
  type Platform,
  type Rect,
} from '@floating-ui/dom';
import { assert, AssertionError } from '@lib/assert';
import { boxes, type FloatingMeasurement } from '../boxes';

/** The anchor: 100 wide, 40 tall, offset inside the offset parent. */
const ANCHOR: Rect = { x: 50, y: 200, width: 100, height: 40 };

/** The window, narrower than the anchor. */
const SUBJECT: Dimensions = { width: 80, height: 30 };

/** Room enough that `shift` never fires unless a test shrinks it. */
const BOUNDARY: Rect = { x: -1000, y: -1000, width: 3000, height: 3000 };

/**
 * The default crossing into the viewport's space: an offset parent
 * sitting 7 across and 13 down from the viewport's corner, with nothing
 * scrolled. A translation, which is the ordinary case.
 */
const VIEWPORT = (rect: Rect): Rect => ({
  ...rect,
  x: rect.x + 7,
  y: rect.y + 13,
});

interface Scene {
  placement: Placement;
  anchor?: Rect;
  subject?: Dimensions;
  boundary?: Rect;
  before?: Middleware[];

  /**
   * How the platform crosses from the offset parent's space into the
   * viewport's. The identity for a scene whose offset parent sits at the
   * viewport's corner.
   */
  convert?: (rect: Rect) => Rect;
}

/**
 * A platform reporting the scene's rects instead of measuring the DOM.
 * The build merges it over its own, so only the measuring calls are
 * replaced; the option is typed as the whole platform, hence the
 * assertion.
 */
const platformFor = (scene: Scene): Platform => {
  const convert = scene.convert ?? VIEWPORT;

  const platform: Partial<Platform> = {
    getElementRects: () => ({
      reference: scene.anchor ?? ANCHOR,

      // What the DOM platform reports: the window's size at the origin,
      // because placing it is `computePosition`'s job.
      floating: { x: 0, y: 0, ...(scene.subject ?? SUBJECT) },
    }),
    getDimensions: () => scene.subject ?? SUBJECT,
    getClippingRect: () => scene.boundary ?? BOUNDARY,

    getOffsetParent: () => document.createElement('div'),
    convertOffsetParentRelativeRectToViewportRelativeRect: ({
      rect,
    }: {
      rect: Rect;
    }) => convert(rect),
  };

  return platform as Platform;
};

/** Measure a scene and hand back the report with the position. */
const measure = async (scene: Scene) => {
  // The window's list always carries `boxes`, which is what makes the
  // report a typed read rather than a cast at every use.
  const result: FloatingMeasurement = await computePosition(
    document.createElement('div'),
    document.createElement('div'),
    {
      placement: scene.placement,
      platform: platformFor(scene),
      middleware: [...(scene.before ?? []), boxes()],
    },
  );

  return { x: result.x, y: result.y, data: result.middlewareData.boxes };
};

describe('boxes', () => {
  it('forwards the measured anchor and window boxes', async () => {
    const { x, y, data } = await measure({ placement: 'bottom' });

    expect(data).toEqual({
      anchor: { ...ANCHOR, clientX: ANCHOR.x + 7, clientY: ANCHOR.y + 13 },
      subject: { x, y, clientX: x + 7, clientY: y + 13, ...SUBJECT },
    });
  });

  it("reports the window's box where the measurement put it", async () => {
    const { x, y, data } = await measure({ placement: 'bottom' });

    assert(data, 'The middleware reported nothing.');

    // Not `rects.floating`, which the platform reports at the origin.
    expect(data.subject.x).toBe(x);
    expect(data.subject.y).toBe(y);
  });

  it('reports the anchor in the same space as the position', async () => {
    const { x, y, data } = await measure({ placement: 'bottom' });

    assert(data, 'The middleware reported nothing.');

    // The window is centered on the anchor and sits below it, so the
    // anchor's edges are a subtraction away from the window's own. It's
    // the narrower of the two, so the anchor starts before it.
    expect(data.anchor.x - x).toBe(-(100 - 80) / 2);
    expect(data.anchor.y - y).toBe(-40);
  });

  it('keeps every distance the same in both spaces', async () => {
    const { data } = await measure({ placement: 'bottom' });

    assert(data, 'The middleware reported nothing.');

    // What makes the viewport pair worth carrying: an offset parent
    // somewhere on the page displaces both boxes alike, so a reader can
    // compare a pointer against one box without converting the other.
    expect(data.anchor.clientX - data.subject.clientX).toBe(
      data.anchor.x - data.subject.x,
    );
    expect(data.anchor.clientY - data.subject.clientY).toBe(
      data.anchor.y - data.subject.y,
    );
  });

  it('takes the viewport coordinates from the platform', async () => {
    const { data } = await measure({
      placement: 'bottom',

      // Nothing a translation could produce. Crossing into the viewport
      // means accounting for scroll, borders, and scale, so it's the
      // platform's to do; if the middleware did arithmetic of its own
      // instead of asking, this wouldn't come back.
      convert: (rect) => ({ ...rect, x: rect.x * -2, y: 1000 }),
    });

    assert(data, 'The middleware reported nothing.');
    expect(data.anchor.clientX).toBe(ANCHOR.x * -2);
    expect(data.anchor.clientY).toBe(1000);
    expect(data.subject.clientY).toBe(1000);
  });

  it('refuses a platform that cannot reach the viewport', async () => {
    // The only case the pipeline can't set up: the DOM build merges its
    // own platform under whatever it's given, so the conversion is
    // always there. A platform assembled against `@floating-ui/core`
    // needn't have it, and reporting the offset parent's coordinates as
    // the viewport's would be a wrong answer that looks like a right
    // one — so the middleware is called here with the bare platform core
    // asks for, and nothing more.
    const state: MiddlewareState = {
      x: 0,
      y: 0,
      initialPlacement: 'bottom',
      placement: 'bottom',
      strategy: 'absolute',
      middlewareData: {},
      rects: { reference: ANCHOR, floating: { x: 0, y: 0, ...SUBJECT } },
      elements: {
        reference: document.createElement('div'),
        floating: document.createElement('div'),
      },
      platform: {
        getElementRects: () => ({
          reference: ANCHOR,
          floating: { x: 0, y: 0, ...SUBJECT },
        }),
        getClippingRect: () => BOUNDARY,
        getDimensions: () => SUBJECT,

        // Required of a platform handed to a middleware, and unreachable
        // from this one: nothing here detects overflow.
        detectOverflow: () =>
          Promise.resolve({ top: 0, right: 0, bottom: 0, left: 0 }),
      },
    };

    await expect(async () => boxes().fn(state)).rejects.toThrow(AssertionError);
  });

  it('keeps that true after a constraint has moved the window', async () => {
    const { x, data } = await measure({
      placement: 'bottom',

      // A boundary tight on the right drags the window back inside it,
      // away from the anchor's center. `shift` reads the boundary
      // through the same conversion, and this one is given in the offset
      // parent's space, so the scene puts the offset parent at the
      // viewport's corner and the two spaces coincide.
      boundary: { x: 0, y: 0, width: 120, height: 1000 },
      before: [shift({ padding: 0 })],
      convert: (rect) => rect,
    });

    assert(data, 'The middleware reported nothing.');
    expect(x).toBe(40);
    expect(data.anchor.x - x).toBe(10);
    expect(data.subject.x).toBe(40);
  });

  it('reports the same anchor whatever the offset', async () => {
    const plain = await measure({ placement: 'top-start' });
    const nudged = await measure({
      placement: 'top-start',
      before: [offset({ mainAxis: 8, alignmentAxis: 4 })],
    });

    assert(plain.data, 'The middleware reported nothing.');
    assert(nudged.data, 'The middleware reported nothing.');

    // The anchor is geometry, not placement: an offset moves the window
    // and leaves the box it was measured against alone.
    expect(nudged.data.anchor).toEqual(plain.data.anchor);

    // The window's box is the window's position, so it goes along.
    expect(nudged.y).toBe(plain.y - 8);
    expect(nudged.data.subject.y).toBe(plain.data.subject.y - 8);
    expect(nudged.data.subject.clientY).toBe(plain.data.subject.clientY - 8);
  });

  it('reports a point anchor as the empty box it is', async () => {
    const point: Rect = { x: 10, y: 20, width: 0, height: 0 };
    const { data } = await measure({ placement: 'bottom', anchor: point });

    expect(data?.anchor).toEqual({
      ...point,
      clientX: point.x + 7,
      clientY: point.y + 13,
    });
  });

  it('makes no decisions', async () => {
    const scene: Scene = { placement: 'bottom' };
    const bare = await computePosition(
      document.createElement('div'),
      document.createElement('div'),
      { placement: scene.placement, platform: platformFor(scene) },
    );
    const reported = await measure(scene);

    expect({ x: reported.x, y: reported.y }).toEqual({ x: bare.x, y: bare.y });
  });
});
