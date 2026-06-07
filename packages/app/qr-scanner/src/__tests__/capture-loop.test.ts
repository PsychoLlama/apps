import { startCaptureLoop } from '../capture-loop';
import { requestDecode } from '../decoder';
import type { ScanResult } from '../store';

// Stub the worker round-trip — we drive decode verdicts by hand and never
// want the real `?worker` module pulled in.
vi.mock('../decoder', () => ({ requestDecode: vi.fn() }));

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

const result: ScanResult = { text: 'https://example.com', format: 'QR_CODE' };

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

describe('startCaptureLoop', () => {
  it('reports the first decoded result and then stops sampling', async () => {
    vi.mocked(requestDecode).mockResolvedValue(result);
    const onResult = vi.fn();
    const { video, fire } = rvfcVideo();

    startCaptureLoop(video, () => ({}) as Worker, onResult);
    fire(0);
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledWith(result));

    // The hit unsubscribed the loop — a later frame samples nothing.
    fire(1000);
    await Promise.resolve();
    expect(requestDecode).toHaveBeenCalledTimes(1);
  });

  it('holds a single frame in flight, dropping frames sampled while busy', async () => {
    let settle!: (decoded: ScanResult | null) => void;
    vi.mocked(requestDecode).mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      }),
    );
    const { video, fire } = rvfcVideo();

    startCaptureLoop(video, () => ({}) as Worker, vi.fn());
    fire(0);
    await vi.waitFor(() => expect(requestDecode).toHaveBeenCalledOnce());

    // A second frame arrives before the first decode settles — skipped.
    fire(1000);
    await Promise.resolve();
    expect(requestDecode).toHaveBeenCalledTimes(1);

    settle(null);
  });

  it('stops sampling once unsubscribed', () => {
    const { video, fire } = rvfcVideo();

    const unsubscribe = startCaptureLoop(video, () => ({}) as Worker, vi.fn());
    unsubscribe();
    fire(0);

    expect(requestDecode).not.toHaveBeenCalled();
  });

  it('skips frames until a decoder is available, then decodes', async () => {
    vi.mocked(requestDecode).mockResolvedValue(null);
    const worker = {} as Worker;
    const slot: { decoder: Worker | undefined } = { decoder: undefined };
    const { video, fire } = rvfcVideo();

    startCaptureLoop(video, () => slot.decoder, vi.fn());

    // Decoder still preloading — frames are sampled but nothing is sent.
    fire(0);
    await Promise.resolve();
    expect(requestDecode).not.toHaveBeenCalled();

    // Worker lands; the next frame decodes.
    slot.decoder = worker;
    fire(1000);
    await vi.waitFor(() => expect(requestDecode).toHaveBeenCalledOnce());
    expect(requestDecode).toHaveBeenCalledWith(worker, expect.anything());
  });
});
