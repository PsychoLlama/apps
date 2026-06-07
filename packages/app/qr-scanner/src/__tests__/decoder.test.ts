import { requestDecode, type DecodeRequest } from '../decoder';
import type { ScanResult } from '../store';

/**
 * A worker stand-in that captures each posted request so the test can
 * reply by hand. It never transfers, so the handed-over `port` stays live
 * in this realm — exactly what we need to drive replies.
 */
const fakeWorker = () => {
  const inbox: DecodeRequest[] = [];
  const worker = {
    postMessage: (data: DecodeRequest) => void inbox.push(data),
  } as unknown as Worker;

  return {
    worker,
    /** Reply to the Nth request received, on the port it supplied. */
    reply: (index: number, result: ScanResult | null) =>
      inbox[index].port.postMessage(result),
  };
};

describe('requestDecode', () => {
  it('resolves with the worker verdict for a hit', async () => {
    const { worker, reply } = fakeWorker();
    const result: ScanResult = {
      text: 'https://example.com',
      format: 'QR_CODE',
    };

    const pending = requestDecode(worker, {} as ImageBitmap);
    reply(0, result);

    await expect(pending).resolves.toEqual(result);
  });

  it('resolves with null on a miss', async () => {
    const { worker, reply } = fakeWorker();

    const pending = requestDecode(worker, {} as ImageBitmap);
    reply(0, null);

    await expect(pending).resolves.toBeNull();
  });

  it('routes each reply to the request that sent it, even crossed', async () => {
    // The decoder worker is shared across sessions; a restarted scan can
    // have a request in flight alongside the prior one's. Private reply
    // ports must keep their verdicts from crossing — even when the second
    // request is answered first.
    const { worker, reply } = fakeWorker();
    const first: ScanResult = { text: 'first', format: 'QR_CODE' };
    const second: ScanResult = { text: 'second', format: 'QR_CODE' };

    const firstReply = requestDecode(worker, {} as ImageBitmap);
    const secondReply = requestDecode(worker, {} as ImageBitmap);

    reply(1, second); // answer the second request first
    reply(0, first);

    await expect(firstReply).resolves.toEqual(first);
    await expect(secondReply).resolves.toEqual(second);
  });
});
