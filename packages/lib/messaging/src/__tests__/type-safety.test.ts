import { defineContract } from '@lib/messaging/rpc';
import type { RPC, RpcApi, RpcHandlers, RpcMessage } from '@lib/messaging/rpc';
import type { SendOptions } from '@lib/messaging/message-port';
import type { Transport } from '@lib/messaging/transport';

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

// An endpoint may declare only the call style it exposes, omitting the other
// section entirely rather than spelling out an empty map.
type EventsOnlyApi = { events: { ping(): void } };
type RequestsOnlyApi = { requests: { add(params: { left: number }): number } };

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

  it('accepts an RpcApi that omits a section', () => {
    expectTypeOf<EventsOnlyApi>().toExtend<RpcApi>();
    expectTypeOf<RequestsOnlyApi>().toExtend<RpcApi>();
  });

  it('routes calls against an API that omits a section', () => {
    // `EventsOnlyApi` declares no requests — calling one is off-contract.
    expectTypeOf<RPC<RpcApi, EventsOnlyApi>['request']>()
      .parameter(0)
      .toEqualTypeOf<never>();
    expectTypeOf<RPC<RpcApi, EventsOnlyApi>['notify']>()
      .parameter(0)
      .toEqualTypeOf<'ping'>();
  });

  it('makes the handler section optional when its API section is omitted', () => {
    // `EventsOnlyApi` declares no requests, so a `requests` handler map may be
    // omitted — implementing just the declared `events` is enough.
    expectTypeOf<{
      events: { ping: () => void };
    }>().toExtend<RpcHandlers<EventsOnlyApi>>();
  });

  it('still requires a handler for every declared procedure', () => {
    // `events` is declared, so its handler stays mandatory — an empty object
    // can't stand in.
    // @ts-expect-error - missing the required `events` handler section.
    const handlers: RpcHandlers<EventsOnlyApi> = {};
    expect(handlers).toBeDefined();
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
    // option-carrying one — otherwise `RPC.from<_, _, SendOptions>(neverTransport)`
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

describe('defineContract', () => {
  it('derives a params-only contract from option-taking handlers', () => {
    const api = defineContract<SendOptions>()({
      requests: {
        // A handler that reads the options bag...
        status: (info: { id: number }, options) => {
          options.transfer = [];
          return info.id;
        },
        // ...and a zero-payload request whose only argument is the bag.
        mint: (_params: void, options) => {
          const buffer = new ArrayBuffer(8);
          options.transfer = [buffer];
          return buffer;
        },
      },
      events: {
        ready: (info: { version: string }) => void info,
        ping: () => {},
      },
    });
    type Api = typeof api;

    // Options are stripped; arity is preserved (`mint`/`ping` stay nullary).
    expectTypeOf<Api['requests']['status']>().toEqualTypeOf<
      (params: { id: number }) => number
    >();
    expectTypeOf<Api['requests']['mint']>().toEqualTypeOf<() => ArrayBuffer>();
    expectTypeOf<Api['events']['ready']>().toEqualTypeOf<
      (params: { version: string }) => void
    >();
    expectTypeOf<Api['events']['ping']>().toEqualTypeOf<() => void>();

    // The derived value is a valid contract and stands in as its own handlers.
    expectTypeOf<Api>().toExtend<RpcApi>();
    expectTypeOf(api).toExtend<RpcHandlers<Api, SendOptions>>();
  });

  it('rejects a handler that exceeds (params, options)', () => {
    defineContract<SendOptions>()({
      requests: {
        // @ts-expect-error - a third parameter exceeds (params, options).
        tooMany: (_params: void, _options: SendOptions, extra: number) => extra,
      },
    });
  });

  it('types the options bag from the Options argument', () => {
    defineContract<SendOptions>()({
      requests: {
        bad: (_params: void, options) => {
          // @ts-expect-error - `transfer` is Transferable[], not a string.
          options.transfer = 'nope';
          return 1;
        },
      },
    });
  });
});
