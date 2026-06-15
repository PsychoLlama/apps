import { RPC, type RpcMessage } from '@lib/messaging/rpc';
import {
  MessagePortTransport,
  type SendOptions,
} from '@lib/messaging/message-port';
import type { HostApi } from '../host-api.ts';
import type { WorkerApi } from './rpc.ts';

/**
 * The observability worker. Spawned on the main thread by the OPFS log
 * backend (see `../logging/backends/opfs-worker.ts`). The bare entrypoint
 * that later work will build the off-main-thread telemetry pipeline onto — it
 * serves no requests yet.
 */

// The worker global scope is a `MessageEndpoint` as-is — `postMessage(message,
// transfer)` plus `add/removeEventListener`. This file is typed for the worker
// (see `tsconfig.json`), so `self` reads as a `DedicatedWorkerGlobalScope` and
// satisfies the interface with no cast.
const transport = new MessagePortTransport<RpcMessage, RpcMessage>(self);

const rpc = RPC.from<WorkerApi, HostApi, SendOptions>(transport, {});

// Announce as soon as the worker boots. Nothing waits on it yet — the host
// handles it as a no-op (see ../logging/backends/opfs-worker.ts) — but later
// work (OPFS sink setup, flushing buffered logs) keys off this signal.
rpc.notify('ready');
