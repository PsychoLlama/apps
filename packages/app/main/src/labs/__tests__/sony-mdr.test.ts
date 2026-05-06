import {
  BatteryKind,
  Command,
  DataType,
  FrameDecoder,
  decodeBatteryReply,
  encodeAck,
  encodeBatteryRequest,
  encodeFrame,
  encodeInitRequest,
} from '../sony-mdr';

const hex = (...bytes: number[]) => Uint8Array.from(bytes);

describe('sony-mdr', () => {
  describe('encodeFrame', () => {
    it('encodes the canonical INIT request', () => {
      // type=0x0c, seq=0, payload=[0x00, 0x00] → checksum 0x0e
      expect(encodeInitRequest(0)).toEqual(
        hex(0x3e, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x0e, 0x3c),
      );
    });

    it('encodes a battery request with seq=1', () => {
      // sum: 0x0c + 0x01 + 0x00*3 + 0x02 + 0x10 + 0x01 = 0x20
      expect(encodeBatteryRequest(1)).toEqual(
        hex(0x3e, 0x0c, 0x01, 0x00, 0x00, 0x00, 0x02, 0x10, 0x01, 0x20, 0x3c),
      );
    });

    it('escapes start/end/escape bytes inside the body', () => {
      // Payload contains every byte that requires escaping.
      const wire = encodeFrame({
        type: DataType.Mdr,
        seq: 0,
        payload: hex(0x3c, 0x3d, 0x3e),
      });

      // No raw 0x3c/0x3d/0x3e between START and END.
      const inner = wire.slice(1, -1);
      expect(inner).not.toContain(0x3e);
      expect(inner).not.toContain(0x3c);
      // 0x3d only appears as the escape prefix.
      const escapePositions = [...inner.keys()].filter(
        (idx) => inner[idx] === 0x3d,
      );
      for (const idx of escapePositions) {
        expect([0x33, 0x34, 0x35]).toContain(inner[idx + 1]);
      }
    });
  });

  describe('FrameDecoder', () => {
    it('decodes a clean INIT request round-trip', () => {
      const decoder = new FrameDecoder();
      const frames = decoder.push(encodeInitRequest(0));
      expect(frames).toHaveLength(1);
      expect(frames[0].type).toBe(DataType.Mdr);
      expect(frames[0].seq).toBe(0);
      expect(frames[0].payload).toEqual(hex(Command.InitRequest, 0x00));
    });

    it('handles fragmented reads', () => {
      const decoder = new FrameDecoder();
      const wire = encodeBatteryRequest(0);
      // Split mid-frame.
      expect(decoder.push(wire.subarray(0, 4))).toHaveLength(0);
      const frames = decoder.push(wire.subarray(4));
      expect(frames).toHaveLength(1);
      expect(frames[0].payload).toEqual(
        hex(Command.BatteryLevelRequest, BatteryKind.Single),
      );
    });

    it('handles concatenated frames in a single read', () => {
      const decoder = new FrameDecoder();
      const wire = new Uint8Array([
        ...encodeInitRequest(0),
        ...encodeBatteryRequest(1),
      ]);
      const frames = decoder.push(wire);
      expect(frames).toHaveLength(2);
      expect(frames[0].seq).toBe(0);
      expect(frames[1].seq).toBe(1);
    });

    it('round-trips frames containing escaped bytes', () => {
      const wire = encodeFrame({
        type: DataType.Mdr,
        seq: 0,
        payload: hex(0x3c, 0x3d, 0x3e, 0xff),
      });
      const decoder = new FrameDecoder();
      const frames = decoder.push(wire);
      expect(frames).toHaveLength(1);
      expect(frames[0].payload).toEqual(hex(0x3c, 0x3d, 0x3e, 0xff));
    });

    it('drops frames whose checksum fails', () => {
      const wire = encodeInitRequest(0);
      // Corrupt the checksum byte (second-to-last, before END).
      const corrupted = Uint8Array.from(wire);
      corrupted[corrupted.length - 2] ^= 0x01;
      const decoder = new FrameDecoder();
      expect(decoder.push(corrupted)).toEqual([]);
    });
  });

  describe('encodeAck', () => {
    it('flips seq=0 to a seq=1 ACK', () => {
      // Verified against the device trace: when we send seq=0 the
      // headset replies with `3e 01 01 00 00 00 00 02 3c`.
      expect(encodeAck(0)).toEqual(
        hex(0x3e, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x02, 0x3c),
      );
    });

    it('flips seq=1 to a seq=0 ACK', () => {
      expect(encodeAck(1)).toEqual(
        hex(0x3e, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x3c),
      );
    });
  });

  describe('decodeBatteryReply', () => {
    it('parses a single-battery reply payload', () => {
      const status = decodeBatteryReply(
        hex(Command.BatteryLevelReply, BatteryKind.Single, 78, 0x01),
      );
      expect(status).toEqual({ level: 78, charging: true });
    });

    it('parses a notify payload too', () => {
      const status = decodeBatteryReply(
        hex(Command.BatteryLevelNotify, BatteryKind.Single, 42, 0x00),
      );
      expect(status).toEqual({ level: 42, charging: false });
    });

    it('returns null for non-battery payloads', () => {
      expect(decodeBatteryReply(hex(Command.InitReply, 0x00))).toBeNull();
    });
  });
});
