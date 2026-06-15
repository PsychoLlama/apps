import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import type { HostApi } from '../host-api.ts';
import type { WorkerApi } from './rpc.ts';

/**
 * The observability worker. Spawned on the main thread by the OPFS log
 * backend (see `../logging/backends/opfs-worker.ts`). On boot it hands the host
 * the writable end of a log stream and drains the chunks the host writes back.
 * A stub for the off-main-thread telemetry pipeline — today it just reports
 * chunk sizes; OPFS persistence lands in later work.
 */

// The worker global scope is a `MessageEndpoint` as-is — `postMessage(message,
// transfer)` plus `add/removeEventListener`. This file is typed for the worker
// (see `tsconfig.json`), so `self` reads as a `DedicatedWorkerGlobalScope` and
// satisfies the interface with no cast.
const transport = new MessagePortTransport<RpcMessage, RpcMessage>(self);

const rpc = RPC.from<WorkerApi, HostApi, SendOptions>(transport, {});

// A transform pair bridges the host's writes to this worker: the host's JSON
// backend writes UTF-8 NDJSON into `writable`, and the bytes surface on
// `readable` here. `writable` is transferable, so it's handed over by reference
// (and neutered locally) rather than copied.
const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();

// Announce as soon as the worker boots, handing the host the writable end to
// attach its sink to — carried as the `ready` payload and transferred in the
// same send. Anything logged before the host wires this up is dropped (see the
// backend); buffering is later work.
rpc.notify('ready', writable, { transfer: [writable] });

// Drain the chunks the host writes. Stub: report each chunk's byte length to
// prove the bytes flow end to end. OPFS persistence replaces this later.
const drainLogChunks = async (): Promise<void> => {
  for await (const chunk of readable) {
    // eslint-disable-next-line no-console -- stub proving the byte stream flows; OPFS persistence lands later.
    console.log('OPFS chunk:', chunk.byteLength);
  }
};

void drainLogChunks();
