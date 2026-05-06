/**
 * Sony MDR protocol framing.
 *
 * Reverse-engineered framing used by Sony's WH/WF/LinkBuds line over a
 * vendor RFCOMM channel. A frame is `START | TYPE | SEQ | LEN(BE32) |
 * PAYLOAD | CHECKSUM | END`. Bytes 0x3C/0x3D/0x3E inside the body are
 * escaped — the byte minus 0x09 prefixed with 0x3D — so the markers
 * stay unambiguous on the wire.
 *
 * @see https://github.com/Plutoberth/SonyHeadphonesClient
 */

const START = 0x3e;
const END = 0x3c;
const ESCAPE = 0x3d;
const ESCAPE_OFFSET = 0x09;
const ESCAPED = new Set<number>([START, END, ESCAPE]);
const HEADER_SIZE = 6;

/** Frame type identifiers used in the second byte of a frame. */
export const DataType = {
  /** Empty-payload acknowledgment of the previous data frame. */
  Ack: 0x01,
  /** Standard MDR data frame. WH-1000XM4 and earlier. */
  Mdr: 0x0c,
  /** MDR No.2 data frame. WH-1000XM5/LinkBuds and newer. */
  MdrNo2: 0x0e,
} as const;

/** First byte of a `Mdr` payload. The protocol's "command id". */
export const Command = {
  InitRequest: 0x00,
  InitReply: 0x01,
  ProtocolInfoRequest: 0x02,
  ProtocolInfoReply: 0x03,
  GetCapabilityRequest: 0x06,
  GetCapabilityReply: 0x07,
  BatteryLevelRequest: 0x10,
  BatteryLevelReply: 0x11,
  BatteryLevelNotify: 0x12,
} as const;

/** Sub-type for battery commands; selects which battery is being asked about. */
export const BatteryKind = {
  /** Single battery — over-ear headsets like the WH-1000XM4. */
  Single: 0x01,
  /** Charging case battery — WF-* / LinkBuds. */
  Case: 0x0a,
  /** Left + right earbud batteries — WF-* / LinkBuds. */
  Dual: 0x09,
} as const;

export interface Frame {
  type: number;
  seq: number;
  payload: Uint8Array;
}

export interface DecodedFrame extends Frame {
  /** Raw on-wire bytes including START/END markers. */
  raw: Uint8Array;
}

export interface BatteryStatus {
  level: number;
  charging: boolean;
}

/** Encode a frame into the on-wire byte sequence. */
export const encodeFrame = (frame: Frame): Uint8Array => {
  const { type, seq, payload } = frame;
  const len = payload.length;

  const body = new Uint8Array(HEADER_SIZE + len);
  body[0] = type & 0xff;
  body[1] = seq & 0xff;
  body[2] = (len >>> 24) & 0xff;
  body[3] = (len >>> 16) & 0xff;
  body[4] = (len >>> 8) & 0xff;
  body[5] = len & 0xff;
  body.set(payload, HEADER_SIZE);

  const withChecksum = new Uint8Array(body.length + 1);
  withChecksum.set(body, 0);
  withChecksum[body.length] = sum(body);

  const escaped = escape(withChecksum);
  const wire = new Uint8Array(escaped.length + 2);
  wire[0] = START;
  wire.set(escaped, 1);
  wire[wire.length - 1] = END;
  return wire;
};

/** Build an INIT request payload. The handshake every session begins with. */
export const encodeInitRequest = (seq: number): Uint8Array =>
  encodeFrame({
    type: DataType.Mdr,
    seq,
    payload: new Uint8Array([Command.InitRequest, 0x00]),
  });

/** Build a battery-level query for a single-battery device (WH-1000XM4). */
export const encodeBatteryRequest = (seq: number): Uint8Array =>
  encodeFrame({
    type: DataType.Mdr,
    seq,
    payload: new Uint8Array([Command.BatteryLevelRequest, BatteryKind.Single]),
  });

/**
 * Build an ACK for a DATA frame received from the headset. The seq is
 * the inverse of the received seq — that's the protocol's toggle bit.
 * Without these, the device assumes its DATA frame was lost and
 * retransmits it on a short timer.
 */
export const encodeAck = (receivedSeq: number): Uint8Array =>
  encodeFrame({
    type: DataType.Ack,
    seq: receivedSeq === 0 ? 1 : 0,
    payload: new Uint8Array(),
  });

/**
 * Pull a `BatteryStatus` from a reply or notify payload, or `null` if
 * the payload isn't a battery response.
 */
export const decodeBatteryReply = (
  payload: Uint8Array,
): BatteryStatus | null => {
  if (payload.length < 4) return null;
  const cmd = payload[0];
  const isBattery =
    cmd === Command.BatteryLevelReply || cmd === Command.BatteryLevelNotify;
  if (!isBattery) return null;
  return { level: payload[2], charging: payload[3] === 0x01 };
};

/**
 * Streaming frame parser. Feed reads from the serial port via `push`;
 * complete frames are returned in the order they decoded. Tolerates
 * fragmentation (chunk splits a frame) and concatenation (chunk holds
 * multiple frames). Bytes outside START/END markers are silently
 * discarded.
 */
export class FrameDecoder {
  private buffer: number[] = [];

  push(chunk: Uint8Array): DecodedFrame[] {
    const frames: DecodedFrame[] = [];
    for (const byte of chunk) {
      this.buffer.push(byte);
      if (byte !== END) continue;
      const frame = this.tryExtract();
      if (frame) frames.push(frame);
    }
    return frames;
  }

  private tryExtract(): DecodedFrame | null {
    const endIdx = this.buffer.length - 1;
    let startIdx = -1;
    for (let idx = endIdx - 1; idx >= 0; idx--) {
      if (this.buffer[idx] === START) {
        startIdx = idx;
        break;
      }
    }
    if (startIdx === -1) {
      this.buffer = [];
      return null;
    }

    const raw = Uint8Array.from(this.buffer.slice(startIdx, endIdx + 1));
    this.buffer = this.buffer.slice(endIdx + 1);

    const body = unescape(raw.subarray(1, raw.length - 1));
    if (body.length < HEADER_SIZE + 1) return null;

    const checksum = body[body.length - 1];
    const headerAndPayload = body.subarray(0, body.length - 1);
    if (sum(headerAndPayload) !== checksum) return null;

    const declaredLen =
      (headerAndPayload[2] << 24) |
      (headerAndPayload[3] << 16) |
      (headerAndPayload[4] << 8) |
      headerAndPayload[5];
    const payload = headerAndPayload.subarray(HEADER_SIZE);
    if (payload.length !== declaredLen) return null;

    return {
      type: headerAndPayload[0],
      seq: headerAndPayload[1],
      payload: Uint8Array.from(payload),
      raw,
    };
  }
}

const sum = (bytes: Uint8Array): number => {
  let total = 0;
  for (const byte of bytes) total = (total + byte) & 0xff;
  return total;
};

const escape = (bytes: Uint8Array): Uint8Array => {
  const out: number[] = [];
  for (const byte of bytes) {
    if (ESCAPED.has(byte)) {
      out.push(ESCAPE, byte - ESCAPE_OFFSET);
    } else {
      out.push(byte);
    }
  }
  return Uint8Array.from(out);
};

const unescape = (bytes: Uint8Array): Uint8Array => {
  const out: number[] = [];
  for (let idx = 0; idx < bytes.length; idx++) {
    const byte = bytes[idx];
    if (byte === ESCAPE && idx + 1 < bytes.length) {
      out.push(bytes[++idx] + ESCAPE_OFFSET);
    } else {
      out.push(byte);
    }
  }
  return Uint8Array.from(out);
};
