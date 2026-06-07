import { fitDimensions, MAX_FRAME_EDGE } from '../frame-fit';

describe('fitDimensions', () => {
  it('passes a frame within budget through untouched', () => {
    expect(fitDimensions(320, 240)).toEqual({ width: 320, height: 240 });
  });

  it('never upscales a frame smaller than the cap', () => {
    expect(fitDimensions(100, 50)).toEqual({ width: 100, height: 50 });
  });

  it('scales a landscape frame so the long edge hits the cap', () => {
    expect(fitDimensions(1920, 1080)).toEqual({
      width: MAX_FRAME_EDGE,
      height: 360,
    });
  });

  it('scales a portrait frame so the long edge hits the cap', () => {
    expect(fitDimensions(1080, 1920)).toEqual({
      width: 360,
      height: MAX_FRAME_EDGE,
    });
  });

  it('preserves aspect ratio, rounding to whole pixels', () => {
    const { width, height } = fitDimensions(1280, 720);
    expect(width).toBe(MAX_FRAME_EDGE);
    expect(height).toBe(Math.round((720 / 1280) * MAX_FRAME_EDGE));
  });

  it('honors a caller-supplied cap', () => {
    expect(fitDimensions(1000, 500, 100)).toEqual({ width: 100, height: 50 });
  });

  it('never collapses a sliver edge below one pixel', () => {
    expect(fitDimensions(1000, 1, 100).height).toBe(1);
  });
});
