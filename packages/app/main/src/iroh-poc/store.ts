import { createStore, defineAction, defineStore, useAction } from '@lib/state';

/** Whether the session opened because we dialed or because a peer did. */
export type SessionDirection = 'incoming' | 'outgoing';

/** Lifecycle state of a single chat session. */
export type SessionStatus = 'open' | 'closed';

/** Where a chat message came from. `system` covers local lifecycle notes. */
export type MessageAuthor = 'me' | 'peer' | 'system';

/** One row in a session's chat log. */
export interface ChatMessage {
  /** Monotonic id for `<For>` keying — never reused. */
  id: number;
  /** UTC `HH:MM:SS` slice of when the message was appended. */
  time: string;
  /** Origin of the message. */
  author: MessageAuthor;
  /** Body text. */
  text: string;
}

/** Per-session UI state. The wasm `Session` handle lives outside the store. */
export interface SessionInfo {
  /** Stable id assigned at session creation; matches the wasm registry key. */
  id: number;
  /** Stringified ed25519 public key of the remote peer. */
  peerId: string;
  /** Whether we dialed (`outgoing`) or accepted (`incoming`). */
  direction: SessionDirection;
  /** `closed` once either side has torn the connection down. */
  status: SessionStatus;
  /** Controlled value of the per-session composer input. */
  draft: string;
  /** True while a `send()` call is in flight. */
  sending: boolean;
  /** Chat history in chronological order. */
  messages: ReadonlyArray<ChatMessage>;
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
   * peer pastes into the connect form. Empty until the relay is online.
   */
  ticket: string;
  /** Controlled value of the "peer ticket" form field. */
  peerTicket: string;
  /** True while a `connect()` call is in flight. */
  dialing: boolean;
  /** Latest dial error, if any. Cleared on the next dial attempt. */
  dialError: string | null;
  /** Live chat sessions, oldest first. */
  sessions: ReadonlyArray<SessionInfo>;
}

const initialState: IrohPocState = {
  status: 'booting',
  error: null,
  endpointId: '',
  ticket: '',
  peerTicket: '',
  dialing: false,
  dialError: null,
  sessions: [],
};

const irohPocStore = defineStore<IrohPocState>(() => ({ ...initialState }));

/** Live, readonly view of the POC state. */
export const irohPoc = createStore(irohPocStore);

let messageCounter = 0;
const nextMessageId = (): number => ++messageCounter;

const timestamp = (): string => new Date().toISOString().slice(11, 19);

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

const setPeerTicketAction = defineAction(
  [irohPocStore],
  (state, value: string) => {
    state.peerTicket = value;
  },
);

const setDialingAction = defineAction(
  [irohPocStore],
  (state, value: boolean) => {
    state.dialing = value;
  },
);

const setDialErrorAction = defineAction(
  [irohPocStore],
  (state, value: string | null) => {
    state.dialError = value;
  },
);

const addSessionAction = defineAction(
  [irohPocStore],
  (
    state,
    input: { id: number; peerId: string; direction: SessionDirection },
  ) => {
    state.sessions = [
      ...state.sessions,
      {
        id: input.id,
        peerId: input.peerId,
        direction: input.direction,
        status: 'open',
        draft: '',
        sending: false,
        messages: [
          {
            id: nextMessageId(),
            time: timestamp(),
            author: 'system',
            text:
              input.direction === 'incoming'
                ? `Connected from ${input.peerId.slice(0, 12)}`
                : `Connected to ${input.peerId.slice(0, 12)}`,
          },
        ],
      },
    ];
  },
);

const updateSession = (
  state: IrohPocState,
  sessionId: number,
  updater: (session: SessionInfo) => SessionInfo,
): void => {
  state.sessions = state.sessions.map((session) =>
    session.id === sessionId ? updater(session) : session,
  );
};

const appendMessageAction = defineAction(
  [irohPocStore],
  (
    state,
    input: { sessionId: number; author: MessageAuthor; text: string },
  ) => {
    updateSession(state, input.sessionId, (session) => ({
      ...session,
      messages: [
        ...session.messages,
        {
          id: nextMessageId(),
          time: timestamp(),
          author: input.author,
          text: input.text,
        },
      ],
    }));
  },
);

const setSessionDraftAction = defineAction(
  [irohPocStore],
  (state, input: { sessionId: number; draft: string }) => {
    updateSession(state, input.sessionId, (session) => ({
      ...session,
      draft: input.draft,
    }));
  },
);

const setSessionSendingAction = defineAction(
  [irohPocStore],
  (state, input: { sessionId: number; sending: boolean }) => {
    updateSession(state, input.sessionId, (session) => ({
      ...session,
      sending: input.sending,
    }));
  },
);

const markSessionClosedAction = defineAction(
  [irohPocStore],
  (state, sessionId: number) => {
    updateSession(state, sessionId, (session) =>
      session.status === 'closed'
        ? session
        : {
            ...session,
            status: 'closed',
            messages: [
              ...session.messages,
              {
                id: nextMessageId(),
                time: timestamp(),
                author: 'system',
                text: 'Session closed',
              },
            ],
          },
    );
  },
);

const removeSessionAction = defineAction(
  [irohPocStore],
  (state, sessionId: number) => {
    state.sessions = state.sessions.filter(
      (session) => session.id !== sessionId,
    );
  },
);

const resetAction = defineAction([irohPocStore], (state) => {
  Object.assign(state, initialState);
  state.sessions = [];
});

/** Shape returned by {@link useIrohPocActions}. */
export interface IrohPocActions {
  endpointIdReady: (endpointId: string) => void;
  ticketReady: (ticket: string) => void;
  bootFailed: (message: string) => void;
  setPeerTicket: (value: string) => void;
  setDialing: (value: boolean) => void;
  setDialError: (value: string | null) => void;
  addSession: (input: {
    id: number;
    peerId: string;
    direction: SessionDirection;
  }) => void;
  appendMessage: (
    sessionId: number,
    author: MessageAuthor,
    text: string,
  ) => void;
  setSessionDraft: (sessionId: number, draft: string) => void;
  setSessionSending: (sessionId: number, sending: boolean) => void;
  markSessionClosed: (sessionId: number) => void;
  removeSession: (sessionId: number) => void;
  /** Wipe state back to defaults — used on component disposal. */
  reset: () => void;
}

/** Bind the POC actions inside a component scope. */
export const useIrohPocActions = (): IrohPocActions => ({
  endpointIdReady: useAction(endpointIdReadyAction),
  ticketReady: useAction(ticketReadyAction),
  bootFailed: useAction(bootFailedAction),
  setPeerTicket: useAction(setPeerTicketAction),
  setDialing: useAction(setDialingAction),
  setDialError: useAction(setDialErrorAction),
  addSession: useAction(addSessionAction),
  appendMessage: (sessionId, author, text) =>
    useAction(appendMessageAction)({ sessionId, author, text }),
  setSessionDraft: (sessionId, draft) =>
    useAction(setSessionDraftAction)({ sessionId, draft }),
  setSessionSending: (sessionId, sending) =>
    useAction(setSessionSendingAction)({ sessionId, sending }),
  markSessionClosed: useAction(markSessionClosedAction),
  removeSession: useAction(removeSessionAction),
  reset: useAction(resetAction),
});

let sessionCounter = 0;
/** Allocate a unique session id, shared between the store and wasm registry. */
export const nextSessionId = (): number => ++sessionCounter;
