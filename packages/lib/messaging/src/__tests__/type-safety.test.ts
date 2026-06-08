import type { RPC, RpcApi } from '@lib/messaging';

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
});
