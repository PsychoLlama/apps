import { createFrameSampler, startCaptureLoop } from '../capture-loop';
import { requestDecode } from '../decoder';
import type { ScanResult } from '../store';

// Stub the worker round-trip — we drive decode verdicts by hand and never
// want the real `?worker` module pulled in.
vi.mock('../decoder', () => ({ requestDecode: vi.fn() }));

const result: ScanResult = {
  text: 'https://example.com',
  format: 'QR_CODE',
  kind: 'url',
  details: [],
};

/** A bare `<video>` — `createImageBitmap` is stubbed, so it's never read. */
const fakeVideo = {} as HTMLVideoElement;

beforeEach(() => {
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(() => Promise.resolve({} as ImageBitmap)),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(requestDecode).mockReset();
});

/** A fresh, live signal — the common case where the loop hasn't torn down. */
const liveSignal = () => new AbortController().signal;

describe('createFrameSampler', () => {
  it('reports a decoded result and signals a hit', async () => {
    vi.mocked(requestDecode).mockResolvedValue(result);
    const onResult = vi.fn();
    const onHit = vi.fn();
    const sample = createFrameSampler(
      fakeVideo,
      () => ({}) as Worker,
      onResult,
      onHit,
      liveSignal(),
    );

    await sample();

    expect(onResult).toHaveBeenCalledWith(result);
    expect(onHit).toHaveBeenCalledOnce();
  });

  it('reports nothing and never signals a hit on a miss', async () => {
    vi.mocked(requestDecode).mockResolvedValue(null);
    const onResult = vi.fn();
    const onHit = vi.fn();
    const sample = createFrameSampler(
      fakeVideo,
      () => ({}) as Worker,
      onResult,
      onHit,
      liveSignal(),
    );

    await sample();

    expect(onResult).not.toHaveBeenCalled();
    expect(onHit).not.toHaveBeenCalled();
  });

  it('holds a single frame in flight, skipping samples taken while busy', async () => {
    let settle!: (decoded: ScanResult | null) => void;
    vi.mocked(requestDecode).mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      }),
    );
    const sample = createFrameSampler(
      fakeVideo,
      () => ({}) as Worker,
      vi.fn(),
      vi.fn(),
      liveSignal(),
    );

    const pending = sample(); // enters flight; parks on the decode
    await sample(); // taken while busy — resolves at once, no decode
    expect(requestDecode).toHaveBeenCalledOnce();

    settle(null);
    await pending;
  });

  it('skips sampling until a decoder is available', async () => {
    const slot: { decoder: Worker | undefined } = { decoder: undefined };
    const sample = createFrameSampler(
      fakeVideo,
      () => slot.decoder,
      vi.fn(),
      vi.fn(),
      liveSignal(),
    );

    // Decoder still preloading — the frame is taken but nothing is sent.
    await sample();
    expect(requestDecode).not.toHaveBeenCalled();

    // Worker lands; the next sample decodes against it.
    slot.decoder = {} as Worker;
    vi.mocked(requestDecode).mockResolvedValue(null);
    await sample();
    expect(requestDecode).toHaveBeenCalledWith(slot.decoder, expect.anything());
  });

  it('swallows a failed decode and frees the slot for the next sample', async () => {
    vi.mocked(requestDecode).mockRejectedValueOnce(new Error('grab failed'));
    const sample = createFrameSampler(
      fakeVideo,
      () => ({}) as Worker,
      vi.fn(),
      vi.fn(),
      liveSignal(),
    );

    await expect(sample()).resolves.toBeUndefined(); // no throw escapes

    // The failure cleared the in-flight guard — the next sample proceeds.
    vi.mocked(requestDecode).mockResolvedValue(null);
    await sample();
    expect(requestDecode).toHaveBeenCalledTimes(2);
  });

  it('never decodes once its signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const sample = createFrameSampler(
      fakeVideo,
      () => ({}) as Worker,
      vi.fn(),
      vi.fn(),
      controller.signal,
    );

    await sample();

    expect(requestDecode).not.toHaveBeenCalled();
  });

  it('drops a verdict that lands after the loop is aborted', async () => {
    let settle!: (decoded: ScanResult | null) => void;
    vi.mocked(requestDecode).mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      }),
    );
    const onResult = vi.fn();
    const onHit = vi.fn();
    const controller = new AbortController();
    const sample = createFrameSampler(
      fakeVideo,
      () => ({}) as Worker,
      onResult,
      onHit,
      controller.signal,
    );

    const pending = sample(); // enters flight; parks on the decode
    controller.abort(); // teardown while the worker is still chewing
    settle(result); // the verdict lands late, against a dead loop
    await pending;

    expect(onResult).not.toHaveBeenCalled();
    expect(onHit).not.toHaveBeenCalled();
  });
});

/**
 * A `<video>` exposing `requestVideoFrameCallback` whose pending callback
 * fires on demand at a chosen timestamp — lets us deliver frames to the
 * loop deterministically without a real element.
 */
const rvfcVideo = () => {
  let pending: ((now: number) => void) | undefined;
  const request = vi.fn((cb: (now: number) => void) => {
    pending = cb;
    return 1;
  });
  const video = {
    requestVideoFrameCallback: request,
    cancelVideoFrameCallback: vi.fn(),
  } as unknown as HTMLVideoElement;
  return { video, fire: (now: number) => pending?.(now) };
};

describe('startCaptureLoop', () => {
  it('reports the first hit and unsubscribes so later frames are ignored', async () => {
    vi.mocked(requestDecode).mockResolvedValue(result);
    const onResult = vi.fn();
    const { video, fire } = rvfcVideo();

    startCaptureLoop(video, () => ({}) as Worker, onResult);
    fire(0);
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledWith(result));

    // The hit unsubscribed the loop — `onVideoFrame` stops re-arming, so a
    // late frame finds no live callback and samples nothing.
    fire(1000);
    expect(requestDecode).toHaveBeenCalledTimes(1);
  });

  it('stops sampling once unsubscribed', () => {
    const { video, fire } = rvfcVideo();

    const unsubscribe = startCaptureLoop(video, () => ({}) as Worker, vi.fn());
    unsubscribe();
    fire(0);

    expect(requestDecode).not.toHaveBeenCalled();
  });

  it('drops a hit whose decode resolves after teardown', async () => {
    let settle!: (decoded: ScanResult | null) => void;
    // Hold the very promise the sampler awaits, so the test can await it
    // too — the sampler's continuation is chained ahead of ours, so once
    // this resolves its hit-or-skip has already run. No timer guesswork.
    const decode = new Promise<ScanResult | null>((resolve) => {
      settle = resolve;
    });
    vi.mocked(requestDecode).mockReturnValue(decode);
    const onResult = vi.fn();
    const { video, fire } = rvfcVideo();

    const unsubscribe = startCaptureLoop(video, () => ({}) as Worker, onResult);
    fire(0); // a frame enters flight
    await vi.waitFor(() => expect(requestDecode).toHaveBeenCalledOnce());

    unsubscribe(); // teardown while the decode is still in flight
    settle(result); // the verdict lands after the loop is gone
    await decode;

    expect(onResult).not.toHaveBeenCalled();
  });
});
