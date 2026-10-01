/**
 * Tests for the boxes middleware.
 *
 * Same harness as the arrow suite: the real `computePosition` pipeline
 * with a platform reporting hand-built rects. What's worth testing isn't
 * the forwarding — it's the coordinate space, which is the whole reason
 * to read the report instead of measuring, and the claim that the
 * anchor's offset from the window is a subtraction.
 */

import {
  computePosition,
  offset,
  shift,
  type Dimensions,
  type Middleware,
  type Placement,
  type Platform,
  type Rect,
} from '@floating-ui/dom';
import { assert } from '@lib/assert';
import { boxes, type FloatingMeasurement } from '../boxes';

/** The anchor: 100 wide, 40 tall, offset inside the offset parent. */
const ANCHOR: Rect = { x: 50, y: 200, width: 100, height: 40 };

/** The window, narrower than the anchor. */
const SUBJECT: Dimensions = { width: 80, height: 30 };

/** Room enough that `shift` never fires unless a test shrinks it. */
const BOUNDARY: Rect = { x: -1000, y: -1000, width: 3000, height: 3000 };

interface Scene {
  placement: Placement;
  anchor?: Rect;
  subject?: Dimensions;
  boundary?: Rect;
  before?: Middleware[];
}

/**
 * A platform reporting the scene's rects instead of measuring the DOM.
 * The build merges it over its own, so only the measuring calls are
 * replaced; the option is typed as the whole platform, hence the
 * assertion.
 */
const platformFor = (scene: Scene): Platform => {
  const platform: Partial<Platform> = {
    getElementRects: () => ({
      reference: scene.anchor ?? ANCHOR,

      // What the DOM platform reports: the window's size at the origin,
      // because placing it is `computePosition`'s job.
      floating: { x: 0, y: 0, ...(scene.subject ?? SUBJECT) },
    }),
    getDimensions: () => scene.subject ?? SUBJECT,
    getClippingRect: () => scene.boundary ?? BOUNDARY,
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
  it('forwards the measured anchor box and window size', async () => {
    const { data } = await measure({ placement: 'bottom' });

    expect(data).toEqual({
      anchor: ANCHOR,
      subject: { width: 80, height: 30 },
    });
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

  it('keeps that true after a constraint has moved the window', async () => {
    const { x, data } = await measure({
      placement: 'bottom',

      // A boundary tight on the right drags the window back inside it,
      // away from the anchor's center.
      boundary: { x: 0, y: 0, width: 120, height: 1000 },
      before: [shift({ padding: 0 })],
    });

    assert(data, 'The middleware reported nothing.');
    expect(x).toBe(40);
    expect(data.anchor.x - x).toBe(10);
  });

  it('reports the same boxes whatever the offset', async () => {
    const plain = await measure({ placement: 'top-start' });
    const nudged = await measure({
      placement: 'top-start',
      before: [offset({ mainAxis: 8, alignmentAxis: 4 })],
    });

    // The report is geometry, not placement: an offset moves the window
    // and leaves both boxes alone.
    expect(nudged.data).toEqual(plain.data);
    expect(nudged.y).toBe(plain.y - 8);
  });

  it('reports a point anchor as the empty box it is', async () => {
    const point: Rect = { x: 10, y: 20, width: 0, height: 0 };
    const { data } = await measure({ placement: 'bottom', anchor: point });

    expect(data?.anchor).toEqual(point);
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
