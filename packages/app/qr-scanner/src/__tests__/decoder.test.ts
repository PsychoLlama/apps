import { requestDecode, type DecoderConnection } from '../decoder';
import type { ScanResult } from '../store';

/**
 * A connection whose RPC records each `request` call and replies with a
 * canned verdict — enough to assert `requestDecode` forwards the frame
 * correctly. Correlation across concurrent frames is the RPC library's
 * job (and tested there), so we don't re-litigate it here.
 */
const fakeConnection = (verdict: ScanResult | null) => {
  const request = vi.fn().mockResolvedValue(verdict);
  const connection = {
    worker: {} as Worker,
    rpc: { request },
  } as unknown as DecoderConnection;

  return { connection, request };
};

describe('requestDecode', () => {
  it('requests a decode, transferring the bitmap, and resolves with a hit', async () => {
    const result: ScanResult = {
      text: 'https://example.com',
      format: 'QR_CODE',
      kind: 'url',
      details: [],
    };
    const { connection, request } = fakeConnection(result);
    const bitmap = {} as ImageBitmap;

    await expect(requestDecode(connection, bitmap)).resolves.toEqual(result);
    expect(request).toHaveBeenCalledWith(
      'decode',
      { bitmap },
      { transfer: [bitmap] },
    );
  });

  it('resolves with null on a miss', async () => {
    const { connection } = fakeConnection(null);

    await expect(
      requestDecode(connection, {} as ImageBitmap),
    ).resolves.toBeNull();
  });
});
