import { RPC, type RpcHandlers, type RpcMessage } from '@lib/messaging';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/transport';
import {
  requestDecode,
  type DecoderApi,
  type DecoderConnection,
  type HostApi,
} from '../decoder';
import type { ScanResult } from '../store';

const result: ScanResult = {
  text: 'https://example.com',
  format: 'QR_CODE',
  kind: 'url',
  details: [],
};

/**
 * Wire a real host↔worker RPC pair over a `MessageChannel`, serving `decode`
 * from a caller-supplied handler. The returned `connection` is exactly what
 * `requestDecode` consumes, so the request rides a genuine transport — id
 * correlation and the transfer list included — rather than a hand-stubbed
 * `rpc.request`.
 */
const setup = (
  decode: RpcHandlers<DecoderApi, SendOptions>['requests']['decode'],
) => {
  const channel = new MessageChannel();
  const handler = vi.fn(decode);

  const host = RPC.from<HostApi, DecoderApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(channel.port1),
    { events: { ready: () => {} } },
  );
  RPC.from<DecoderApi, HostApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(channel.port2),
    { requests: { decode: handler } },
  );
  // `MessagePort` endpoints stay dormant until started — without this the
  // request would post but never reach the worker side.
  channel.port1.start();
  channel.port2.start();

  // `requestDecode` only ever touches `rpc`; the worker handle is inert here.
  const connection: DecoderConnection = { worker: {} as Worker, rpc: host };
  return { connection, decode: handler };
};

describe('requestDecode', () => {
  it('requests a decode, transferring the bitmap, and resolves with a hit', async () => {
    const { connection, decode } = setup(() => result);
    // A real transferable so the `{ transfer: [bitmap] }` send doesn't trap —
    // the host's handle neuters once posted, proving the frame moved by
    // reference rather than by copy.
    const bitmap = new ArrayBuffer(8) as unknown as ImageBitmap;

    await expect(requestDecode(connection, bitmap)).resolves.toEqual(result);

    expect(decode).toHaveBeenCalledOnce();
    const received = decode.mock.calls[0][0].bitmap as unknown as ArrayBuffer;
    expect(received.byteLength).toBe(8); // arrived intact on the worker side
    expect((bitmap as unknown as ArrayBuffer).byteLength).toBe(0); // gone here
  });

  it('resolves with null on a miss', async () => {
    const { connection } = setup(() => null);

    await expect(
      requestDecode(connection, new ArrayBuffer(8) as unknown as ImageBitmap),
    ).resolves.toBeNull();
  });
});
