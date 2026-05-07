import { createStore, defineAction, defineStore, useAction } from '@lib/state';

/**
 * Inbound (server-role) connection lifecycle event yielded by the wasm
 * `EchoNode.events()` ReadableStream. Mirrors the Rust enum, so any
 * field rename here needs a matching change in `src/lib.rs`.
 */
export interface AcceptEvent {
  type: 'accepted' | 'echoed' | 'closed';
  endpointId: string;
  text?: string;
  error?: string | null;
}

/** Outbound (client-role) lifecycle event from `EchoNode.connect()`. */
export interface ConnectEvent {
  type: 'connected' | 'sent' | 'echoed' | 'closed';
  bytes?: number;
  text?: string;
  error?: string | null;
}

/** Whether a log line came from the host or client side of the page. */
export type LogRole = 'incoming' | 'outgoing';

/** One row in either the inbound or outbound event log. */
export interface LogLine {
  /** Monotonic id for `<For>` keying — never reused. */
  id: number;
  /** UTC `HH:MM:SS` slice of when the line was appended. */
  time: string;
  /** Which side of the page the line belongs to. */
  role: LogRole;
  /** Display text. Already formatted by the caller. */
  message: string;
}

/** Top-level lifecycle of the wasm node + its relay assignment. */
export type IrohPocStatus = 'booting' | 'awaitingRelay' | 'ready' | 'error';

/** Snapshot of every reactive value the page reads. */
export interface IrohPocState {
  /** Where in the boot sequence we currently are. */
  status: IrohPocStatus;
  /** Populated only when {@link status} is `error`. */
  error: string | null;
  /** Stringified ed25519 public key — the node's stable identifier. */
  endpointId: string;
  /**
   * JSON-serialized `EndpointAddr` (id + assigned home-relay URL) the
   * peer pastes into the client form. Empty until the relay is online.
   */
  ticket: string;
  /** Controlled value of the "peer ticket" form field. */
  peerTicket: string;
  /** Controlled value of the "message" form field. */
  payload: string;
  /** Append-only log shown across the host + client panels. */
  lines: ReadonlyArray<LogLine>;
  /** True while a client-side dial is in flight. */
  sending: boolean;
}

const initialState: IrohPocState = {
  status: 'booting',
  error: null,
  endpointId: '',
  ticket: '',
  peerTicket: '',
  payload: 'hi from the browser',
  lines: [],
  sending: false,
};

const irohPocStore = defineStore<IrohPocState>(() => ({ ...initialState }));

/** Live, readonly view of the POC state. */
export const irohPoc = createStore(irohPocStore);

let logCounter = 0;

const endpointIdReadyAction = defineAction(
  [irohPocStore],
  (state, endpointId: string) => {
    state.endpointId = endpointId;
    state.status = 'awaitingRelay';
  },
);

const ticketReadyAction = defineAction(
  [irohPocStore],
  (state, ticket: string) => {
    state.ticket = ticket;
    state.status = 'ready';
  },
);

const bootFailedAction = defineAction(
  [irohPocStore],
  (state, message: string) => {
    state.status = 'error';
    state.error = message;
  },
);

const appendLineAction = defineAction(
  [irohPocStore],
  (state, line: { role: LogRole; message: string }) => {
    state.lines = [
      ...state.lines,
      {
        id: ++logCounter,
        time: new Date().toISOString().slice(11, 19),
        role: line.role,
        message: line.message,
      },
    ];
  },
);

const setPeerTicketAction = defineAction(
  [irohPocStore],
  (state, value: string) => {
    state.peerTicket = value;
  },
);

const setPayloadAction = defineAction(
  [irohPocStore],
  (state, value: string) => {
    state.payload = value;
  },
);

const setSendingAction = defineAction(
  [irohPocStore],
  (state, value: boolean) => {
    state.sending = value;
  },
);

const resetAction = defineAction([irohPocStore], (state) => {
  Object.assign(state, initialState);
  state.lines = [];
});

/** Shape returned by {@link useIrohPocActions}. */
export interface IrohPocActions {
  endpointIdReady: (endpointId: string) => void;
  ticketReady: (ticket: string) => void;
  bootFailed: (message: string) => void;
  appendLine: (role: LogRole, message: string) => void;
  setPeerTicket: (value: string) => void;
  setPayload: (value: string) => void;
  setSending: (value: boolean) => void;
  /** Wipe state back to defaults — used on component disposal. */
  reset: () => void;
}

/** Bind the POC actions inside a component scope. */
export const useIrohPocActions = (): IrohPocActions => ({
  endpointIdReady: useAction(endpointIdReadyAction),
  ticketReady: useAction(ticketReadyAction),
  bootFailed: useAction(bootFailedAction),
  appendLine: (role, message) => useAction(appendLineAction)({ role, message }),
  setPeerTicket: useAction(setPeerTicketAction),
  setPayload: useAction(setPayloadAction),
  setSending: useAction(setSendingAction),
  reset: useAction(resetAction),
});
