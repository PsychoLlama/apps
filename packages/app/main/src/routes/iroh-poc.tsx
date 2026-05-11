import {
  For,
  Show,
  createEffect,
  onCleanup,
  onMount,
  type Component,
} from 'solid-js';
import {
  Badge,
  Button,
  Callout,
  Card,
  Container,
  Flex,
  Heading,
  IconButton,
  Text,
  TextField,
} from '@lib/ui';
import IconClose from 'virtual:icons/mdi/close';
import { useSearchParams } from '@solidjs/router';
import { SiteHeader } from '@lib/shell';
import { irohPoc, nextSessionId, useIrohPocActions } from '../iroh-poc/store';
import type {
  IrohPocActions,
  SessionDirection,
  SessionView,
} from '../iroh-poc/store';
import * as css from './iroh-poc.css';

/**
 * Wasm `Session` shape. Imported dynamically inside `onMount`, so the
 * type lives here as a duck-typed mirror of the wasm-bindgen surface.
 */
interface WasmSession {
  peerId: () => string;
  send: (text: string) => Promise<void>;
  messages: () => ReadableStream<string>;
  closed: () => Promise<void>;
  close: () => void;
  free: () => void;
}

/** Mirror of `EchoNode`. */
interface WasmEchoNode {
  endpointId: () => string;
  ticket: () => Promise<string>;
  sessions: () => ReadableStream<WasmSession>;
  connect: (ticket: string) => Promise<WasmSession>;
  free: () => void;
}

const describe = (value: unknown): string => {
  if (value instanceof Error) return value.message;
  try {
    return String(value);
  } catch {
    return 'unknown error';
  }
};

const truncate = (id: string): string => id.slice(0, 12);

const IrohPoc: Component = () => {
  const actions = useIrohPocActions();
  const [searchParams, setSearchParams] = useSearchParams<{
    ticket?: string;
  }>();
  const registry = new Map<number, WasmSession>();
  let node: WasmEchoNode | null = null;
  let disposed = false;
  let autoDialed = false;

  const adoptSession = (
    wasmSession: WasmSession,
    direction: SessionDirection,
  ): number => {
    const id = nextSessionId();
    const peerId = wasmSession.peerId();
    registry.set(id, wasmSession);
    actions.addSession({ id, peerId, direction });
    void drainMessages(id, wasmSession);
    void watchClose(id, wasmSession);
    return id;
  };

  const drainMessages = async (sessionId: number, session: WasmSession) => {
    const reader = session.messages().getReader();
    try {
      while (!disposed) {
        const { value, done } = await reader.read();
        if (done) break;
        actions.appendMessage(sessionId, 'peer', value);
      }
    } catch (err) {
      if (!disposed) {
        actions.appendMessage(
          sessionId,
          'system',
          `messages error: ${describe(err)}`,
        );
      }
    }
  };

  const watchClose = async (sessionId: number, session: WasmSession) => {
    try {
      await session.closed();
    } finally {
      if (!disposed) actions.markSessionClosed(sessionId);
    }
  };

  const drainSessions = async (
    stream: ReadableStream<WasmSession>,
  ): Promise<void> => {
    const reader = stream.getReader();
    try {
      while (!disposed) {
        const { value, done } = await reader.read();
        if (done) break;
        adoptSession(value, 'incoming');
      }
    } catch (err) {
      if (!disposed) actions.bootFailed(`sessions error: ${describe(err)}`);
    }
  };

  const boot = async () => {
    try {
      const wasm = await import('../../iroh-poc/pkg/iroh_poc.js');
      await wasm.default();
      const spawned = (await wasm.EchoNode.spawn()) as unknown as WasmEchoNode;
      if (disposed) {
        spawned.free();
        return;
      }
      node = spawned;
      actions.endpointIdReady(spawned.endpointId());
      void drainSessions(spawned.sessions());
      // `ticket()` waits for `Endpoint::online`, so the home-relay URL
      // is baked into the JSON before a remote tab tries to dial.
      spawned
        .ticket()
        .then((value) => {
          if (!disposed) actions.ticketReady(value);
        })
        .catch((err: unknown) => {
          if (!disposed) actions.bootFailed(describe(err));
        });
    } catch (err) {
      actions.bootFailed(describe(err));
    }
  };

  onMount(() => {
    void boot();
  });

  onCleanup(() => {
    disposed = true;
    for (const session of registry.values()) {
      try {
        session.close();
      } catch {
        // Already closed; ignore.
      }
      session.free();
    }
    registry.clear();
    node?.free();
    actions.reset();
  });

  const dial = async (ticket: string) => {
    if (!node) return;
    actions.setDialing(true);
    actions.setDialError(null);
    try {
      const session = await node.connect(ticket);
      adoptSession(session, 'outgoing');
      actions.setPeerTicket('');
    } catch (err) {
      actions.setDialError(describe(err));
    } finally {
      actions.setDialing(false);
    }
  };

  const onConnectSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    const ticket = irohPoc.peerTicket.trim();
    if (!ticket || irohPoc.dialing) return;
    void dial(ticket);
  };

  const sendOnSession = async (session: SessionView) => {
    const handle = registry.get(session.id);
    const text = session.draft.trim();
    if (!handle || !text || session.status !== 'open' || session.sending)
      return;
    actions.setSessionSending(session.id, true);
    try {
      await handle.send(text);
      actions.appendMessage(session.id, 'me', text);
      actions.setSessionDraft(session.id, '');
    } catch (err) {
      actions.appendMessage(
        session.id,
        'system',
        `send failed: ${describe(err)}`,
      );
    } finally {
      actions.setSessionSending(session.id, false);
    }
  };

  const closeSession = (session: SessionView) => {
    const handle = registry.get(session.id);
    handle?.close();
    handle?.free();
    registry.delete(session.id);
    actions.removeSession(session.id);
  };

  const copyTicket = () => {
    const value = irohPoc.ticket;
    if (!value) return;
    const url = new URL(window.location.href);
    url.searchParams.set('ticket', value);
    void navigator.clipboard.writeText(url.toString()).catch(() => {
      // Clipboard permission denied or unavailable — non-fatal.
    });
  };

  // Auto-dial when a peer's `?ticket=` link brought us here. Wait for
  // the node to be ready, then consume the param exactly once and
  // strip it from the URL so refreshes don't keep re-dialing and the
  // user's own copy-ticket link stays clean.
  createEffect(() => {
    if (autoDialed) return;
    if (irohPoc.status !== 'ready') return;
    const incoming = searchParams.ticket;
    if (typeof incoming !== 'string' || !incoming) return;
    autoDialed = true;
    setSearchParams({ ticket: undefined }, { replace: true });
    void dial(incoming);
  });

  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Iroh chat POC" />

      <Flex as="section" direction="column" align="center" px={5} py={6}>
        <Container as="div" size={3}>
          <Flex as="div" direction="column" gap={5}>
            <Flex as="header" direction="column" gap={2}>
              <Heading as="h1" size={6}>
                Iroh chat in the browser
              </Heading>
              <Text as="p" color="lowContrast">
                Spawns an iroh endpoint inside this page (relay-only — UDP isn't
                available from a browser sandbox), holds connections open, and
                multiplexes each chat message over its own short-lived stream.
              </Text>
            </Flex>

            <Show when={irohPoc.status === 'error'}>
              <Callout color="danger">{irohPoc.error}</Callout>
            </Show>

            <Card as="section" size={2} variant="surface">
              <Flex as="div" direction="column" gap={3}>
                <Flex as="div" align="center" justify="between" gap={3}>
                  <Heading as="h2" size={4}>
                    Your endpoint
                  </Heading>
                  <Badge
                    color={irohPoc.status === 'ready' ? 'success' : 'neutral'}
                  >
                    {irohPoc.status}
                  </Badge>
                </Flex>
                <Text as="p" size={2} color="lowContrast">
                  Share the link below with another tab or peer to let them dial
                  you — opening it auto-connects. The ticket bundles your
                  endpoint id with the assigned home-relay URL.
                </Text>
                <Show
                  when={irohPoc.endpointId}
                  fallback={
                    <Text as="p" size={2}>
                      Booting iroh…
                    </Text>
                  }
                >
                  <Text as="span" size={1} color="lowContrast">
                    endpoint id
                  </Text>
                  <Text as="code" class={css.idCode} selectable>
                    {irohPoc.endpointId}
                  </Text>
                  <Show
                    when={irohPoc.ticket}
                    fallback={
                      <Text as="p" size={2}>
                        Waiting for relay assignment…
                      </Text>
                    }
                  >
                    <Text as="span" size={1} color="lowContrast">
                      connect ticket
                    </Text>
                    <Text as="code" class={css.idCode} selectable>
                      {irohPoc.ticket}
                    </Text>
                    <Flex as="div" gap={2}>
                      <Button
                        testId="iroh-poc-copy-ticket"
                        type="button"
                        size={1}
                        variant="soft"
                        onClick={copyTicket}
                      >
                        Copy share link
                      </Button>
                    </Flex>
                  </Show>
                </Show>
              </Flex>
            </Card>

            <Card as="section" size={2} variant="surface">
              <Flex
                as="form"
                direction="column"
                gap={3}
                onSubmit={onConnectSubmit}
              >
                <Heading as="h2" size={4}>
                  Connect to a peer
                </Heading>
                <Text as="p" size={2} color="lowContrast">
                  Paste a connect ticket and we'll open a fresh chat session
                  with that peer.
                </Text>
                <Flex as="div" direction="column" gap={1}>
                  <Text as="span" size={2}>
                    Peer connect ticket
                  </Text>
                  <TextField
                    testId="iroh-poc-peer-ticket"
                    name="peer-ticket"
                    value={irohPoc.peerTicket}
                    onInput={(event) =>
                      actions.setPeerTicket(event.currentTarget.value)
                    }
                    placeholder="paste connect ticket…"
                    spellcheck={false}
                    autocapitalize="none"
                    autocomplete="off"
                    enterkeyhint="go"
                    required
                  />
                </Flex>
                <Show when={irohPoc.dialError}>
                  <Callout color="danger">{irohPoc.dialError}</Callout>
                </Show>
                <Flex as="div" gap={2}>
                  <Button
                    testId="iroh-poc-connect"
                    type="submit"
                    size={2}
                    disabled={irohPoc.status !== 'ready' || irohPoc.dialing}
                  >
                    {irohPoc.dialing ? 'Connecting…' : 'Connect'}
                  </Button>
                </Flex>
              </Flex>
            </Card>

            <Show
              when={irohPoc.sessions.length > 0}
              fallback={
                <Text as="p" size={2} color="lowContrast">
                  No open sessions. Share your ticket or paste one above to
                  start chatting.
                </Text>
              }
            >
              <Flex as="div" direction="column" gap={4}>
                <For each={irohPoc.sessions}>
                  {(session) => (
                    <SessionCard
                      session={session}
                      actions={actions}
                      onSend={() => void sendOnSession(session)}
                      onClose={() => closeSession(session)}
                    />
                  )}
                </For>
              </Flex>
            </Show>
          </Flex>
        </Container>
      </Flex>
    </Flex>
  );
};

interface SessionCardProps {
  session: SessionView;
  actions: IrohPocActions;
  onSend: () => void;
  onClose: () => void;
}

const SessionCard: Component<SessionCardProps> = (props) => {
  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    props.onSend();
  };

  return (
    <Card as="section" size={2} variant="surface">
      <Flex as="div" direction="column" gap={3}>
        <Flex as="header" align="center" justify="between" gap={3}>
          <Flex as="div" direction="column" gap={1}>
            <Flex as="div" align="center" gap={2}>
              <Heading as="h3" size={3} selectable>
                {truncate(props.session.peerId)}
              </Heading>
              <Badge
                color={
                  props.session.direction === 'outgoing' ? 'accent' : 'neutral'
                }
                size={1}
              >
                {props.session.direction}
              </Badge>
              <Badge
                color={props.session.status === 'open' ? 'success' : 'neutral'}
                size={1}
              >
                {props.session.status}
              </Badge>
            </Flex>
            <Text as="span" size={1} color="lowContrast" selectable>
              {props.session.peerId}
            </Text>
          </Flex>
          <IconButton
            testId={`iroh-poc-session-close-${props.session.id}`}
            type="button"
            size={1}
            variant="soft"
            color="neutral"
            aria-label="Close session"
            onClick={() => props.onClose()}
          >
            <IconClose />
          </IconButton>
        </Flex>

        <Flex
          as="div"
          direction="column"
          gap={2}
          class={css.messageList}
          aria-live="polite"
        >
          <For each={props.session.messages} fallback={null}>
            {(message) => (
              <Flex
                as="div"
                direction="column"
                gap={1}
                class={
                  message.author === 'me'
                    ? css.messageRowMe
                    : message.author === 'peer'
                      ? css.messageRowPeer
                      : css.messageRowSystem
                }
              >
                <Text
                  as="p"
                  selectable
                  class={
                    message.author === 'me'
                      ? css.messageBubbleMe
                      : message.author === 'peer'
                        ? css.messageBubblePeer
                        : css.messageBubbleSystem
                  }
                >
                  {message.text}
                </Text>
                <Text as="span" size={1} color="lowContrast" selectable={false}>
                  {message.time}
                </Text>
              </Flex>
            )}
          </For>
        </Flex>

        <Flex as="form" direction="row" gap={2} onSubmit={onSubmit}>
          <Flex as="div" direction="column" grow>
            <TextField
              testId={`iroh-poc-session-draft-${props.session.id}`}
              name={`draft-${props.session.id}`}
              value={props.session.draft}
              placeholder={
                props.session.status === 'open'
                  ? 'Type a message…'
                  : 'Session closed'
              }
              disabled={props.session.status !== 'open'}
              onInput={(event) =>
                props.actions.setSessionDraft(
                  props.session.id,
                  event.currentTarget.value,
                )
              }
              autocomplete="off"
              autocapitalize="sentences"
              enterkeyhint="send"
            />
          </Flex>
          <Button
            testId={`iroh-poc-session-send-${props.session.id}`}
            type="submit"
            size={2}
            disabled={
              props.session.status !== 'open' ||
              props.session.sending ||
              props.session.draft.trim().length === 0
            }
          >
            {props.session.sending ? 'Sending…' : 'Send'}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
};

export default IrohPoc;
