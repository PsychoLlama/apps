import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import type { HostApi } from '../../host-api';
import { start } from '../start';
import type { WorkerSink, WorkerApi } from '../rpc';

// Collect bytes written to the sink. Lines cross a real `MessageChannel` and
// come back structurally cloned — equal contents, fresh identity — so tests
// compare normalized `number[]` rather than typed-array references.
const collectingSink = () => {
  const writes: number[][] = [];
  let onWrite: (() => void) | undefined;
  const sink: WorkerSink = {
    open: vi.fn(() => Promise.resolve()),
    write: vi.fn<(chunk: Uint8Array) => void>((chunk) => {
      writes.push([...chunk]);
      onWrite?.();
    }),
    flush: vi.fn(),
  };
  // Resolves once `count` lines have landed — an exact hook for delivery over
  // the async channel, no polling.
  const landed = (count: number) =>
    new Promise<void>((resolve) => {
      onWrite = () => {
        if (writes.length >= count) resolve();
      };
    });
  return { sink, writes, landed };
};

// Stand in for a connecting tab: a started `MessagePort` wired to a host-side
// RPC, plus the worker-side port the binder consumes.
const connectTab = (connect: (port: MessagePort) => void) => {
  const { port1, port2 } = new MessageChannel();
  port1.start();
  connect(port2);
  return RPC.from<HostApi, WorkerApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(port1),
    {},
  );
};

describe('start', () => {
  it('opens the shared sink at boot, before any tab connects', () => {
    const { sink } = collectingSink();

    start(sink);

    expect(sink.open).toHaveBeenCalledTimes(1);
  });

  it('routes a connected tab’s log events into the shared sink', async () => {
    const { sink, writes, landed } = collectingSink();
    const tab = connectTab(start(sink));
    const settled = landed(1);

    tab.notify('log', new Uint8Array([1, 2, 3]));
    await settled;

    expect(writes).toEqual([[1, 2, 3]]);
  });

  it('funnels every tab into the one shared sink', async () => {
    const { sink, writes, landed } = collectingSink();
    const connect = start(sink);
    const settled = landed(2);

    connectTab(connect).notify('log', new Uint8Array([1]));
    connectTab(connect).notify('log', new Uint8Array([2]));
    await settled;

    expect(writes).toContainEqual([1]);
    expect(writes).toContainEqual([2]);
  });
});
