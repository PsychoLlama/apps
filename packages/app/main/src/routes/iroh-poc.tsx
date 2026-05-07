import { For, Show, onCleanup, onMount, type Component } from 'solid-js';
import {
  Badge,
  Button,
  Callout,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  TextField,
} from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import {
  irohPoc,
  useIrohPocActions,
  type AcceptEvent,
  type ConnectEvent,
} from '../iroh-poc/store';
import * as css from './iroh-poc.css';

/**
 * Whatever `EchoNode.spawn()` resolves to. Imported dynamically inside
 * `onMount` so the wasm bundle never gets pulled into the SSR /
 * prerender build — Vite would happily try, and the iroh runtime
 * crashes outside a browser.
 */
type EchoNodeHandle = {
  endpointId: () => string;
  ticket: () => Promise<string>;
  events: () => ReadableStream<AcceptEvent>;
  connect: (ticket: string, payload: string) => ReadableStream<ConnectEvent>;
  free: () => void;
};

const formatAcceptEvent = (event: AcceptEvent): string => {
  const peer = event.endpointId.slice(0, 12);
  switch (event.type) {
    case 'accepted':
      return `← ${peer} connected`;
    case 'echoed':
      return `← ${peer} sent "${event.text ?? ''}" (echoed back)`;
    case 'closed':
      return event.error
        ? `← ${peer} closed with error: ${event.error}`
        : `← ${peer} closed cleanly`;
  }
};

const formatConnectEvent = (event: ConnectEvent): string => {
  switch (event.type) {
    case 'connected':
      return '→ connected';
    case 'sent':
      return `→ sent ${event.bytes ?? 0} byte(s)`;
    case 'echoed':
      return `→ received "${event.text ?? ''}"`;
    case 'closed':
      return event.error
        ? `→ closed with error: ${event.error}`
        : '→ closed cleanly';
  }
};

const peerEndpointId = (ticket: string): string | null => {
  try {
    const parsed = JSON.parse(ticket) as { id?: unknown };
    return typeof parsed.id === 'string' ? parsed.id.slice(0, 12) : null;
  } catch {
    return null;
  }
};

const describe = (value: unknown): string => {
  if (value instanceof Error) return value.message;
  try {
    return String(value);
  } catch {
    return 'unknown error';
  }
};

const IrohPoc: Component = () => {
  const actions = useIrohPocActions();
  let node: EchoNodeHandle | null = null;
  let disposed = false;

  const boot = async () => {
    try {
      const wasm = await import('../../iroh-poc/pkg/iroh_poc.js');
      await wasm.default();
      const spawned =
        (await wasm.EchoNode.spawn()) as unknown as EchoNodeHandle;
      if (disposed) {
        spawned.free();
        return;
      }
      node = spawned;
      const id = spawned.endpointId();
      actions.endpointIdReady(id);
      actions.appendLine('incoming', `endpoint id — ${id}`);

      const reader = spawned.events().getReader();
      // `ticket()` waits for `Endpoint::online`, so the home-relay URL
      // is baked into the JSON before a remote tab tries to dial.
      spawned
        .ticket()
        .then((value) => {
          if (disposed) return;
          actions.ticketReady(value);
          actions.appendLine('incoming', 'connect ticket ready');
        })
        .catch((err: unknown) => {
          if (!disposed) actions.bootFailed(describe(err));
        });

      const drainEvents = async () => {
        try {
          while (!disposed) {
            const { value, done } = await reader.read();
            if (done) break;
            actions.appendLine('incoming', formatAcceptEvent(value));
          }
        } catch (err) {
          if (!disposed) {
            actions.appendLine('incoming', `events error: ${describe(err)}`);
          }
        }
      };
      void drainEvents();
    } catch (err) {
      actions.bootFailed(describe(err));
    }
  };

  onMount(() => {
    void boot();
  });

  onCleanup(() => {
    disposed = true;
    node?.free();
    actions.reset();
  });

  const dial = async (ticket: string, payload: string) => {
    const handle = node;
    if (!handle) return;
    actions.setSending(true);
    actions.appendLine(
      'outgoing',
      `→ dialing ${peerEndpointId(ticket) ?? ticket.slice(0, 24) + '…'}`,
    );
    try {
      const stream = handle.connect(ticket, payload);
      const reader = stream.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        actions.appendLine('outgoing', formatConnectEvent(value));
      }
    } catch (err) {
      actions.appendLine('outgoing', `connection failed: ${describe(err)}`);
    } finally {
      actions.setSending(false);
    }
  };

  const onConnectSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    const ticket = irohPoc.peerTicket.trim();
    const message = irohPoc.payload;
    if (!ticket || irohPoc.sending) return;
    void dial(ticket, message);
  };

  const copyTicket = () => {
    const value = irohPoc.ticket;
    if (!value) return;
    void navigator.clipboard
      .writeText(value)
      .then(() =>
        actions.appendLine('incoming', 'connect ticket copied to clipboard'),
      )
      .catch(() => {
        // Clipboard permission denied or unavailable — non-fatal.
      });
  };

  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Iroh P2P POC" />

      <Flex as="section" direction="column" align="center" px={5} py={6}>
        <Container as="div" size={3}>
          <Flex as="div" direction="column" gap={5}>
            <Flex as="header" direction="column" gap={2}>
              <Heading as="h1" size={6}>
                Iroh in the browser
              </Heading>
              <Text as="p" color="lowContrast">
                Spawns an iroh endpoint inside this page (relay-only — UDP isn't
                available from a browser sandbox), registers a tiny echo
                protocol, and lets two tabs (or two machines) talk over n0's
                relay.
              </Text>
            </Flex>

            <Show when={irohPoc.status === 'error'}>
              <Callout color="danger">{irohPoc.error}</Callout>
            </Show>

            <Grid as="div" gap={4} class={css.panels}>
              <Card as="section" size={2} variant="surface">
                <Flex as="div" direction="column" gap={3}>
                  <Flex as="div" align="center" justify="between" gap={3}>
                    <Heading as="h2" size={4}>
                      Host
                    </Heading>
                    <Badge
                      color={irohPoc.status === 'ready' ? 'success' : 'neutral'}
                    >
                      {irohPoc.status}
                    </Badge>
                  </Flex>
                  <Text as="p" size={2} color="lowContrast">
                    Share this connect ticket with another tab or peer. It
                    bundles the endpoint id with the assigned home-relay URL, so
                    the dialer can reach you without waiting on DNS discovery.
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
                          Copy ticket
                        </Button>
                      </Flex>
                    </Show>
                  </Show>
                  <Heading as="h3" size={2} weight="medium">
                    Inbound events
                  </Heading>
                  <Flex
                    as="div"
                    direction="column"
                    class={css.log}
                    aria-live="polite"
                  >
                    <For
                      each={irohPoc.lines.filter(
                        (line) => line.role === 'incoming',
                      )}
                      fallback="(none yet)"
                    >
                      {(line) => (
                        <Text as="p" selectable>
                          {line.time} · {line.message}
                        </Text>
                      )}
                    </For>
                  </Flex>
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
                    Client
                  </Heading>
                  <Text as="p" size={2} color="lowContrast">
                    Paste a peer's connect ticket, type a message, and the host
                    will echo it back over the relay.
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
                      required
                    />
                  </Flex>
                  <Flex as="div" direction="column" gap={1}>
                    <Text as="span" size={2}>
                      Message
                    </Text>
                    <TextField
                      testId="iroh-poc-payload"
                      name="payload"
                      value={irohPoc.payload}
                      onInput={(event) =>
                        actions.setPayload(event.currentTarget.value)
                      }
                      placeholder="text to send"
                      required
                    />
                  </Flex>
                  <Flex as="div" gap={2}>
                    <Button
                      testId="iroh-poc-send"
                      type="submit"
                      size={2}
                      disabled={irohPoc.status !== 'ready' || irohPoc.sending}
                    >
                      {irohPoc.sending ? 'Sending…' : 'Send'}
                    </Button>
                  </Flex>
                  <Heading as="h3" size={2} weight="medium">
                    Outbound events
                  </Heading>
                  <Flex
                    as="div"
                    direction="column"
                    class={css.log}
                    aria-live="polite"
                  >
                    <For
                      each={irohPoc.lines.filter(
                        (line) => line.role === 'outgoing',
                      )}
                      fallback="(none yet)"
                    >
                      {(line) => (
                        <Text as="p" selectable>
                          {line.time} · {line.message}
                        </Text>
                      )}
                    </For>
                  </Flex>
                </Flex>
              </Card>
            </Grid>
          </Flex>
        </Container>
      </Flex>
    </Flex>
  );
};

export default IrohPoc;
