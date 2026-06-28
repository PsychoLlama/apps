import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import type { HostApi } from '../../host-api';
import { startHub } from '../hub';
import { createWorkerHandlers, type WorkerSink, type WorkerApi } from '../rpc';

const emptyStream = (): ReadableStream<Uint8Array> =>
  new ReadableStream({ start: (controller) => controller.close() });

const streamOf = (chunks: Uint8Array[]): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });

// A stand-in for the dedicated writer worker: a started `MessagePort` serving
// the real worker handlers over a recording sink, so a test asserts what the
// hub forwarded. Lines cross a real `MessageChannel` and come back structurally
// cloned — equal contents, fresh identity — so writes are normalized to
// `number[]`.
const fakeWriter = () => {
  const writes: number[][] = [];
  let flushes = 0;
  let onEvent: (() => void) | undefined;
  const sink: WorkerSink = {
    open: vi.fn(() => Promise.resolve()),
    write: vi.fn<(chunk: Uint8Array) => void>((chunk) => {
      writes.push([...chunk]);
      onEvent?.();
    }),
    flush: vi.fn<() => void>(() => {
      flushes += 1;
      onEvent?.();
    }),
  };

  const { port1, port2 } = new MessageChannel();
  port2.start();
  RPC.from<WorkerApi, HostApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(port2),
    createWorkerHandlers(sink),
  );

  // Resolves once `predicate` holds — an exact hook for delivery over the async
  // channel, no polling.
  const until = (predicate: () => boolean) =>
    new Promise<void>((resolve) => {
      onEvent = () => {
        if (predicate()) resolve();
      };
    });

  return {
    endpoint: port1,
    writes,
    flushes: () => flushes,
    until,
  };
};

// Stand in for a connecting tab: a started `MessagePort` wired to a host-side
// RPC, plus the worker-side port the hub's binder consumes.
const connectTab = (connect: (port: MessagePort) => void) => {
  const { port1, port2 } = new MessageChannel();
  port1.start();
  connect(port2);
  return RPC.from<HostApi, WorkerApi, SendOptions>(
    new MessagePortTransport<RpcMessage, RpcMessage>(port1),
    {},
  );
};

describe('startHub', () => {
  it('drains the hub’s own logs into the writer', async () => {
    const writer = fakeWriter();

    startHub(
      writer.endpoint,
      streamOf([new Uint8Array([5]), new Uint8Array([6])]),
    );
    await writer.until(() => writer.writes.length >= 2);

    expect(writer.writes).toEqual([[5], [6]]);
  });

  it('relays a connected tab’s log events into the writer', async () => {
    const writer = fakeWriter();
    const tab = connectTab(startHub(writer.endpoint, emptyStream()));

    tab.notify('log', new Uint8Array([1, 2, 3]));
    await writer.until(() => writer.writes.length >= 1);

    expect(writer.writes).toContainEqual([1, 2, 3]);
  });

  it('relays a tab’s flush nudge into the writer', async () => {
    const writer = fakeWriter();
    const tab = connectTab(startHub(writer.endpoint, emptyStream()));

    tab.notify('flush');
    await writer.until(() => writer.flushes() >= 1);

    expect(writer.flushes()).toBe(1);
  });

  it('funnels every tab into the one writer', async () => {
    const writer = fakeWriter();
    const connect = startHub(writer.endpoint, emptyStream());

    connectTab(connect).notify('log', new Uint8Array([1]));
    connectTab(connect).notify('log', new Uint8Array([2]));
    await writer.until(() => writer.writes.length >= 2);

    expect(writer.writes).toContainEqual([1]);
    expect(writer.writes).toContainEqual([2]);
  });
});
