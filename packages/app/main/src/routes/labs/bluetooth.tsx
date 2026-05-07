import { For, Show, onCleanup, onMount } from 'solid-js';
import {
  Badge,
  Button,
  Callout,
  Code,
  Container,
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
  Flex,
  Heading,
  IconButton,
  Text,
} from '@lib/ui';
import IconCopy from 'virtual:icons/mdi/content-copy';
import IconRefresh from 'virtual:icons/mdi/refresh';
import { SiteHeader } from '@lib/shell';
import { createStore, defineAction, defineStore, useAction } from '@lib/state';
import {
  type BatteryStatus,
  type DecodedFrame,
  type NcAsmStatus,
  Command,
  DataType,
  FrameDecoder,
  NcAsmInquiredType,
  commandName,
  decodeBatteryReply,
  decodeNcAsmParam,
  decodeSupportFunctionReply,
  describeNcAsm,
  encodeAck,
  encodeBatteryRequest,
  encodeInitRequest,
  encodeNcAsmGetParamRequest,
  encodeSupportFunctionRequest,
  functionTypeName,
} from '../../labs/sony-mdr';
import * as css from './bluetooth.css';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

/**
 * Tri-state Web Serial detection. Stays `'unknown'` through SSR and
 * initial hydration so the markup matches across the wire — `onMount`
 * flips it to a concrete value once the client has a real `navigator`.
 */
type WebSerialSupport = 'unknown' | 'supported' | 'unsupported';

interface LogEntry {
  id: number;
  direction: 'tx' | 'rx';
  bytes: Uint8Array;
  type?: number;
  seq?: number;
  /** First payload byte of an MDR frame (the command id). */
  command?: number;
}

interface BluetoothState {
  status: ConnectionState;
  error: string | null;
  battery: BatteryStatus | null;
  capabilities: number[] | null;
  ncAsm: NcAsmStatus | null;
  log: LogEntry[];
  webSerial: WebSerialSupport;
}

const MAX_LOG_ENTRIES = 100;

const bluetoothStore = defineStore<BluetoothState>(() => ({
  status: 'idle',
  error: null,
  battery: null,
  capabilities: null,
  ncAsm: null,
  log: [],
  webSerial: 'unknown',
}));

const bluetooth = createStore(bluetoothStore);

const setStatusAction = defineAction(
  [bluetoothStore],
  (state, status: ConnectionState) => {
    state.status = status;
  },
);

const setErrorAction = defineAction(
  [bluetoothStore],
  (state, message: string | null) => {
    state.error = message;
  },
);

const setBatteryAction = defineAction(
  [bluetoothStore],
  (state, battery: BatteryStatus | null) => {
    state.battery = battery;
  },
);

const setCapabilitiesAction = defineAction(
  [bluetoothStore],
  (state, capabilities: number[] | null) => {
    state.capabilities = capabilities;
  },
);

const setNcAsmAction = defineAction(
  [bluetoothStore],
  (state, ncAsm: NcAsmStatus | null) => {
    state.ncAsm = ncAsm;
  },
);

let nextLogId = 0;

const appendLogAction = defineAction(
  [bluetoothStore],
  (state, entry: Omit<LogEntry, 'id'>) => {
    state.log.push({ ...entry, id: ++nextLogId });
    if (state.log.length > MAX_LOG_ENTRIES) {
      state.log.splice(0, state.log.length - MAX_LOG_ENTRIES);
    }
  },
);

const setWebSerialSupportAction = defineAction(
  [bluetoothStore],
  (state, support: WebSerialSupport) => {
    state.webSerial = support;
  },
);

// Minimal ambient Web Serial declarations. Chromium ships the API but
// TypeScript's DOM lib doesn't include it yet; pulling
// `@types/w3c-web-serial` in just for one consumer feels heavy. Names
// are intentionally narrow — only what this route uses.
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
}

interface NavigatorSerial {
  requestPort(): Promise<SerialPort>;
}

declare global {
  interface Navigator {
    readonly serial?: NavigatorSerial;
  }
}

const MDR_FRAME_TYPE = 0x0c;

const formatBytes = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(' ');

const formatLabel = (entry: LogEntry): string => {
  if (entry.type === DataType.Ack) return 'ACK';
  if (entry.command === undefined) {
    return entry.type !== undefined
      ? `type=${entry.type.toString(16).padStart(2, '0')}`
      : '';
  }
  const name = commandName(entry.command);
  return name ?? `cmd=${entry.command.toString(16).padStart(2, '0')}`;
};

const formatHeader = (entry: LogEntry): string => {
  const label = formatLabel(entry);
  const seq = entry.seq ?? 0;
  return `${label} s=${seq}`;
};

const detectWebSerial = (): WebSerialSupport =>
  typeof navigator !== 'undefined' && navigator.serial !== undefined
    ? 'supported'
    : 'unsupported';

const statusColor = (
  status: ConnectionState,
): 'accent' | 'success' | 'danger' | 'neutral' => {
  if (status === 'connected') return 'success';
  if (status === 'error') return 'danger';
  if (status === 'connecting') return 'accent';
  return 'neutral';
};

export default function LabsBluetooth() {
  const actions = {
    setStatus: useAction(setStatusAction),
    setError: useAction(setErrorAction),
    setBattery: useAction(setBatteryAction),
    setCapabilities: useAction(setCapabilitiesAction),
    setNcAsm: useAction(setNcAsmAction),
    appendLog: useAction(appendLogAction),
    setWebSerialSupport: useAction(setWebSerialSupportAction),
  };

  // Run on the client only. Keeping the SSR snapshot in `'unknown'`
  // means the markup matches across hydration; the real value lands
  // here once `navigator` exists.
  onMount(() => actions.setWebSerialSupport(detectWebSerial()));

  let port: SerialPort | null = null;
  let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let seq = 0;
  const decoder = new FrameDecoder();

  const sendAck = async (forSeq: number) => {
    if (!writer) return;
    const bytes = encodeAck(forSeq);
    await writer.write(bytes);
    actions.appendLog({
      direction: 'tx',
      bytes,
      type: DataType.Ack,
      seq: forSeq === 0 ? 1 : 0,
    });
  };

  const handleFrame = async (frame: DecodedFrame) => {
    const isData =
      frame.type === DataType.Mdr || frame.type === DataType.MdrNo2;
    actions.appendLog({
      direction: 'rx',
      bytes: frame.raw,
      type: frame.type,
      seq: frame.seq,
      command:
        isData && frame.payload.length > 0 ? frame.payload[0] : undefined,
    });
    const battery = decodeBatteryReply(frame.payload);
    if (battery) actions.setBattery(battery);
    const capabilities = decodeSupportFunctionReply(frame.payload);
    if (capabilities) actions.setCapabilities(capabilities);
    const ncAsm = decodeNcAsmParam(frame.payload);
    if (ncAsm) actions.setNcAsm(ncAsm);
    // Auto-ACK every DATA frame. Without this the device retransmits.
    if (frame.type !== DataType.Ack) {
      await sendAck(frame.seq);
    }
  };

  const readLoop = async () => {
    if (!reader) return;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        for (const frame of decoder.push(value)) await handleFrame(frame);
      }
    } catch (err) {
      actions.setError(err instanceof Error ? err.message : String(err));
      actions.setStatus('error');
    }
  };

  const send = async (bytes: Uint8Array, type: number, command?: number) => {
    if (!writer) return;
    await writer.write(bytes);
    actions.appendLog({ direction: 'tx', bytes, type, seq, command });
    seq = seq === 0 ? 1 : 0;
  };

  const connect = async () => {
    if (!navigator.serial) return;
    actions.setError(null);
    actions.setStatus('connecting');
    try {
      const selected = await navigator.serial.requestPort();
      // RFCOMM ignores baudRate, but Web Serial requires the field.
      await selected.open({ baudRate: 9600 });
      if (!selected.readable || !selected.writable) {
        throw new Error('Serial port opened without readable/writable streams');
      }
      port = selected;
      writer = selected.writable.getWriter();
      reader = selected.readable.getReader();
      actions.setStatus('connected');
      void readLoop();
      // INIT is the mandatory protocol handshake — fire it immediately
      // so consumers don't have to think about it.
      void send(encodeInitRequest(seq), MDR_FRAME_TYPE, Command.InitRequest);
    } catch (err) {
      actions.setError(err instanceof Error ? err.message : String(err));
      actions.setStatus('error');
    }
  };

  const disconnect = async () => {
    try {
      await reader?.cancel().catch(() => {});
      reader?.releaseLock();
      writer?.releaseLock();
      await port?.close();
    } catch (err) {
      actions.setError(err instanceof Error ? err.message : String(err));
    } finally {
      reader = null;
      writer = null;
      port = null;
      actions.setStatus('idle');
    }
  };

  const handleConnect = () => {
    void connect();
  };
  const handleDisconnect = () => {
    void disconnect();
  };
  const handleQueryBattery = () => {
    void send(
      encodeBatteryRequest(seq),
      MDR_FRAME_TYPE,
      Command.BatteryLevelRequest,
    );
  };
  const handleQueryCapabilities = () => {
    void send(
      encodeSupportFunctionRequest(seq),
      MDR_FRAME_TYPE,
      Command.SupportFunctionRequest,
    );
  };
  const handleQueryNcAsm = () => {
    void send(
      encodeNcAsmGetParamRequest(
        seq,
        NcAsmInquiredType.NoiseCancellingAndAmbientSoundMode,
      ),
      MDR_FRAME_TYPE,
      Command.NcAsmGetParam,
    );
  };

  const handleCopyLog = () => {
    const text = bluetooth.log
      .map((entry) => formatBytes(entry.bytes))
      .join('\n');
    void navigator.clipboard.writeText(text);
  };

  onCleanup(() => {
    void disconnect();
  });

  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Bluetooth lab" />

      <Flex as="section" direction="column" px={5} py={6}>
        <Container as="div" size={3}>
          <Flex as="div" direction="column" gap={6}>
            <Flex as="div" direction="column" gap={2}>
              <Heading as="h1" size={6}>
                Sony MDR over Web Serial
              </Heading>
              <Text as="p" size={3} color="lowContrast">
                Speaks Sony's reverse-engineered control protocol to a paired
                Bluetooth Classic headset over an RFCOMM channel exposed as a
                tty. Read-only for now.
              </Text>
            </Flex>

            <Show when={bluetooth.webSerial === 'unsupported'}>
              <Callout color="warning">
                <Text as="span" size={2} selectable={false}>
                  This browser doesn't expose{' '}
                  <Code color="warning">navigator.serial</Code>. Use a recent
                  Chromium-based browser.
                </Text>
              </Callout>
            </Show>

            <Flex as="div" direction="column" gap={3}>
              <Flex as="div" justify="between" align="center" gap={3}>
                <Heading as="h2" size={4}>
                  Connection
                </Heading>
                <Badge color={statusColor(bluetooth.status)} variant="soft">
                  {bluetooth.status}
                </Badge>
              </Flex>

              <Show when={bluetooth.error}>
                {(message) => (
                  <Callout color="danger">
                    <Text as="span" size={2} selectable={true}>
                      {message()}
                    </Text>
                  </Callout>
                )}
              </Show>

              <Flex as="div" gap={2} wrap="wrap">
                <Button
                  testId="connect"
                  onClick={handleConnect}
                  disabled={
                    bluetooth.status === 'connected' ||
                    bluetooth.webSerial !== 'supported'
                  }
                  skeleton={bluetooth.webSerial === 'unknown'}
                  variant="solid"
                >
                  Connect
                </Button>
                <Button
                  testId="disconnect"
                  onClick={handleDisconnect}
                  disabled={bluetooth.status !== 'connected'}
                  variant="soft"
                  color="neutral"
                >
                  Disconnect
                </Button>
              </Flex>
            </Flex>

            <Flex as="div" direction="column" gap={3}>
              <Heading as="h2" size={4}>
                Device state
              </Heading>
              <DataListRoot orientation="horizontal" size={2}>
                <DataListItem>
                  <DataListLabel>Battery</DataListLabel>
                  <DataListValue>
                    <Flex as="div" align="center" gap={2}>
                      <Show
                        when={bluetooth.battery}
                        fallback={
                          <Text as="span" color="lowContrast">
                            unknown
                          </Text>
                        }
                      >
                        {(status) => (
                          <Text as="span" selectable={true}>
                            {status().level}%
                            {status().charging ? ' (charging)' : ''}
                          </Text>
                        )}
                      </Show>
                      <IconButton
                        testId="refresh-battery"
                        aria-label="Refresh battery"
                        onClick={handleQueryBattery}
                        disabled={bluetooth.status !== 'connected'}
                        variant="ghost"
                        color="neutral"
                        size={1}
                      >
                        <IconRefresh width="16" height="16" />
                      </IconButton>
                    </Flex>
                  </DataListValue>
                </DataListItem>
                <DataListItem>
                  <DataListLabel>Capabilities</DataListLabel>
                  <DataListValue>
                    <Flex as="div" direction="column" gap={2} align="start">
                      <Show
                        when={bluetooth.capabilities}
                        fallback={
                          <Text as="span" color="lowContrast">
                            unknown
                          </Text>
                        }
                      >
                        {(entries) => (
                          <Flex as="ul" direction="column" gap={1}>
                            <For each={entries()}>
                              {(code) => (
                                <Flex as="li">
                                  <Text as="code" size={1} selectable={true}>
                                    {functionTypeName(code) ??
                                      `0x${code.toString(16).padStart(2, '0')}`}
                                  </Text>
                                </Flex>
                              )}
                            </For>
                          </Flex>
                        )}
                      </Show>
                      <IconButton
                        testId="refresh-capabilities"
                        aria-label="Refresh capabilities"
                        onClick={handleQueryCapabilities}
                        disabled={bluetooth.status !== 'connected'}
                        variant="ghost"
                        color="neutral"
                        size={1}
                      >
                        <IconRefresh width="16" height="16" />
                      </IconButton>
                    </Flex>
                  </DataListValue>
                </DataListItem>
                <DataListItem>
                  <DataListLabel>NC / ASM</DataListLabel>
                  <DataListValue>
                    <Flex as="div" align="center" gap={2}>
                      <Show
                        when={bluetooth.ncAsm}
                        fallback={
                          <Text as="span" color="lowContrast">
                            unknown
                          </Text>
                        }
                      >
                        {(status) => (
                          <Text as="span" selectable={true}>
                            {describeNcAsm(status()) ?? 'unrecognised mode'}
                          </Text>
                        )}
                      </Show>
                      <IconButton
                        testId="refresh-ncasm"
                        aria-label="Refresh NC/ASM"
                        onClick={handleQueryNcAsm}
                        disabled={bluetooth.status !== 'connected'}
                        variant="ghost"
                        color="neutral"
                        size={1}
                      >
                        <IconRefresh width="16" height="16" />
                      </IconButton>
                    </Flex>
                  </DataListValue>
                </DataListItem>
              </DataListRoot>
            </Flex>

            <Flex as="div" direction="column" gap={3}>
              <Flex as="div" justify="between" align="center" gap={3}>
                <Heading as="h2" size={4}>
                  Frame log
                </Heading>
                <IconButton
                  testId="copy-log"
                  aria-label="Copy log to clipboard"
                  onClick={handleCopyLog}
                  disabled={bluetooth.log.length === 0}
                  variant="ghost"
                  color="neutral"
                >
                  <IconCopy width="18" height="18" />
                </IconButton>
              </Flex>
              <Show
                when={bluetooth.log.length > 0}
                fallback={
                  <Text as="p" color="lowContrast" size={2}>
                    No frames yet. Connect and send a request.
                  </Text>
                }
              >
                <Flex as="ol" direction="column" class={css.log}>
                  <For each={bluetooth.log}>
                    {(entry) => (
                      <Flex
                        as="li"
                        class={`${css.logRow} ${
                          entry.direction === 'tx' ? css.logRowTx : css.logRowRx
                        }`}
                      >
                        <Text as="span" aria-hidden="true" selectable={false}>
                          {entry.direction === 'tx' ? '↑' : '↓'}
                        </Text>
                        <Text as="span" selectable={false}>
                          {formatHeader(entry)}
                        </Text>
                        <Text as="code" selectable={true}>
                          {formatBytes(entry.bytes)}
                        </Text>
                      </Flex>
                    )}
                  </For>
                </Flex>
              </Show>
            </Flex>
          </Flex>
        </Container>
      </Flex>
    </Flex>
  );
}
