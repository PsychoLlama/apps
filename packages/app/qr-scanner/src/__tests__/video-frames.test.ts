import { MIN_FRAME_INTERVAL_MS, onVideoFrame } from '../video-frames';

/**
 * A video element exposing `requestVideoFrameCallback` whose pending
 * callback can be fired by hand at a chosen timestamp — lets us drive
 * the rVFC path deterministically without a real `<video>`.
 */
const rvfcVideo = () => {
  let pending: ((now: number) => void) | undefined;
  const cancel = vi.fn();
  const request = vi.fn((cb: (now: number) => void) => {
    pending = cb;
    return 1;
  });
  const video = {
    requestVideoFrameCallback: request,
    cancelVideoFrameCallback: cancel,
  } as unknown as HTMLVideoElement;
  return { video, request, cancel, fire: (now: number) => pending?.(now) };
};

/** A video element lacking rVFC — exercises the timer fallback. */
const timerVideo = () => ({}) as unknown as HTMLVideoElement;

describe('onVideoFrame', () => {
  describe('with requestVideoFrameCallback', () => {
    it('invokes the callback per frame and re-subscribes', () => {
      const { video, request, fire } = rvfcVideo();
      const callback = vi.fn();

      onVideoFrame(video, callback);
      fire(0);
      fire(MIN_FRAME_INTERVAL_MS);

      expect(callback).toHaveBeenCalledTimes(2);
      // Initial subscribe + a re-subscribe after each delivered frame.
      expect(request).toHaveBeenCalledTimes(3);
    });

    it('throttles frames closer than the minimum interval', () => {
      const { video, fire } = rvfcVideo();
      const callback = vi.fn();

      onVideoFrame(video, callback);
      fire(0);
      fire(MIN_FRAME_INTERVAL_MS / 2); // too soon — skipped
      fire(MIN_FRAME_INTERVAL_MS); // far enough — fires

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('stops firing and cancels the pending callback on unsubscribe', () => {
      const { video, cancel, fire } = rvfcVideo();
      const callback = vi.fn();

      const unsubscribe = onVideoFrame(video, callback);
      unsubscribe();
      fire(MIN_FRAME_INTERVAL_MS);

      expect(cancel).toHaveBeenCalledWith(1);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('without requestVideoFrameCallback', () => {
    beforeEach(() => void vi.useFakeTimers());
    afterEach(() => void vi.useRealTimers());

    it('falls back to a timer at the target interval', () => {
      const callback = vi.fn();

      onVideoFrame(timerVideo(), callback);
      vi.advanceTimersByTime(MIN_FRAME_INTERVAL_MS * 2);

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('clears the timer on unsubscribe', () => {
      const callback = vi.fn();

      const unsubscribe = onVideoFrame(timerVideo(), callback);
      unsubscribe();
      vi.advanceTimersByTime(MIN_FRAME_INTERVAL_MS * 2);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
