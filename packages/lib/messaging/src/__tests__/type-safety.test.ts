import type { RPC, RpcApi, RpcMessage } from '@lib/messaging';
import type { SendOptions, Transport } from '@lib/messaging/transport';

// Type-level assertions for the guarantees the runtime suite can't reach:
// method-name routing and arity enforcement. The happy-path call typing is
// covered by rpc.test.ts simply compiling.

type ServerApi = {
  requests: {
    add(params: { left: number; right: number }): number;
    echoSize(params: { buffer: ArrayBuffer }): number;
  };
  events: {
    log(params: { message: string }): void;
    ping(): void;
  };
};

type ClientApi = {
  requests: Record<string, never>;
  events: Record<string, never>;
};

type Client = RPC<ClientApi, ServerApi>;

type TwoArgApi = {
  requests: { sum(first: number, second: number): number };
  events: Record<string, never>;
};

describe('RPC type safety', () => {
  it('routes request methods to the remote request API', () => {
    expectTypeOf<Client['request']>()
      .parameter(0)
      .toEqualTypeOf<'add' | 'echoSize'>();
  });

  it('routes notify methods to the remote event API', () => {
    expectTypeOf<Client['notify']>()
      .parameter(0)
      .toEqualTypeOf<'log' | 'ping'>();
  });

  it('accepts a conforming RpcApi', () => {
    expectTypeOf<ServerApi>().toExtend<RpcApi>();
  });

  it('rejects an API whose procedure takes more than one argument', () => {
    expectTypeOf<TwoArgApi>().not.toExtend<RpcApi>();
  });

  it('forbids send options when the transport carries none', () => {
    // Type-only: the closure is never invoked, just type-checked.
    const check = (rpc: RPC<ClientApi, ServerApi>) => {
      // @ts-expect-error - Options defaults to `never`; no options may be passed.
      void rpc.request('add', { left: 1, right: 2 }, { transfer: [] });
    };
    expect(check).toBeTypeOf('function');
  });

  it('permits send options matching the transport Options', () => {
    const check = (rpc: RPC<ClientApi, ServerApi, SendOptions>) => {
      void rpc.request('add', { left: 1, right: 2 }, { transfer: [] });
    };
    expect(check).toBeTypeOf('function');
  });

  it('forbids pairing an option-carrying RPC with a transport that has none', () => {
    // Soundness of `Options`: a no-option transport must NOT satisfy an
    // option-carrying one — otherwise `new RPC<_, _, SendOptions>(neverTransport)`
    // would compile and drop every transfer silently. (Hinges on `Transport`'s
    // members being function-typed properties, which are checked contravariantly.)
    expectTypeOf<Transport<RpcMessage, RpcMessage>>().not.toExtend<
      Transport<RpcMessage, RpcMessage, SendOptions>
    >();

    // The reverse holds: a transferable transport may back an optionless RPC.
    expectTypeOf<Transport<RpcMessage, RpcMessage, SendOptions>>().toExtend<
      Transport<RpcMessage, RpcMessage>
    >();
  });
});
