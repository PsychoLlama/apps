import {
  BatteryKind,
  Command,
  DataType,
  FrameDecoder,
  NcAsmInquiredType,
  commandName,
  decodeBatteryReply,
  decodeNcAsmParam,
  decodeSupportFunctionReply,
  encodeAck,
  encodeBatteryRequest,
  encodeFrame,
  encodeInitRequest,
  encodeNcAsmGetParamRequest,
  encodeSupportFunctionRequest,
  functionTypeName,
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

  describe('commandName', () => {
    it('maps known command ids to names', () => {
      expect(commandName(Command.InitRequest)).toBe('InitRequest');
      expect(commandName(Command.BatteryLevelReply)).toBe('BatteryLevelReply');
    });

    it('returns null for unknown command ids', () => {
      expect(commandName(0xff)).toBeNull();
    });
  });

  describe('encodeSupportFunctionRequest', () => {
    it('encodes a SUPPORT_FUNCTION query with seq=0', () => {
      // sum: 0x0c + 0x00 + 0x00*3 + 0x02 + 0x06 + 0x00 = 0x14
      expect(encodeSupportFunctionRequest(0)).toEqual(
        hex(0x3e, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x02, 0x06, 0x00, 0x14, 0x3c),
      );
    });
  });

  describe('decodeSupportFunctionReply', () => {
    it('parses a reply with three entries', () => {
      // [0x07, 0x00, count=3, code, code, code]
      const entries = decodeSupportFunctionReply(
        hex(Command.SupportFunctionReply, 0x00, 0x03, 0x20, 0x6a, 0xf6),
      );
      expect(entries).toEqual([0x20, 0x6a, 0xf6]);
    });

    it('parses a reply with zero entries', () => {
      const entries = decodeSupportFunctionReply(
        hex(Command.SupportFunctionReply, 0x00, 0x00),
      );
      expect(entries).toEqual([]);
    });

    it('parses a real WH-1000XM4 reply', () => {
      // Captured live from a paired WH-1000XM4. count=0x17 (23 entries).
      // Locks in the 1-byte-per-entry XM4 firmware shape.
      const entries = decodeSupportFunctionReply(
        hex(
          0x07,
          0x00,
          0x17,
          0x71,
          0x38,
          0x62,
          0xf5,
          0x81,
          0x51,
          0xa1,
          0xe1,
          0xe2,
          0xd2,
          0xf6,
          0xd1,
          0xf4,
          0xf3,
          0x39,
          0x12,
          0x13,
          0x11,
          0x30,
          0xc1,
          0x14,
          0x22,
          0x21,
        ),
      );
      expect(entries).toHaveLength(23);
      expect(entries?.[0]).toBe(0x71);
      expect(entries?.[entries.length - 1]).toBe(0x21);
    });

    it('returns null when the payload is truncated', () => {
      // count=4 but only 3 entry bytes follow.
      const entries = decodeSupportFunctionReply(
        hex(Command.SupportFunctionReply, 0x00, 0x04, 0x20, 0x6a, 0xf6),
      );
      expect(entries).toBeNull();
    });

    it('returns null for unrelated command ids', () => {
      expect(
        decodeSupportFunctionReply(hex(Command.BatteryLevelReply, 0x00, 0x00)),
      ).toBeNull();
    });
  });

  describe('functionTypeName', () => {
    it('maps known feature codes to readable names', () => {
      expect(functionTypeName(0x20)).toBe('BATTERY_LEVEL_INDICATOR');
      expect(functionTypeName(0x6a)).toBe(
        'MODE_NC_ASM_NOISE_CANCELLING_DUAL_SINGLE_AMBIENT_SOUND_MODE_LEVEL_ADJUSTMENT',
      );
    });

    it('returns null for unknown feature codes', () => {
      expect(functionTypeName(0x00)).toBeNull();
    });
  });

  describe('encodeNcAsmGetParamRequest', () => {
    it('encodes a GET_PARAM with the XM4 inquiredType', () => {
      // sum: 0x0c + 0x01 + 0x00*3 + 0x02 + 0x66 + 0x02 = 0x77
      expect(
        encodeNcAsmGetParamRequest(
          1,
          NcAsmInquiredType.NoiseCancellingAndAmbientSoundMode,
        ),
      ).toEqual(
        hex(0x3e, 0x0c, 0x01, 0x00, 0x00, 0x00, 0x02, 0x66, 0x02, 0x77, 0x3c),
      );
    });
  });

  describe('decodeNcAsmParam', () => {
    it('parses a RET_PARAM into base header + raw rest', () => {
      // [cmd=0x67, inquiredType=0x02, valueChangeStatus=0x01, ncAsmTotalEffect=0x01, …shape-specific]
      const status = decodeNcAsmParam(
        hex(Command.NcAsmRetParam, 0x02, 0x01, 0x01, 0x02, 0x00, 0x0a),
      );
      expect(status).toEqual({
        inquiredType: 0x02,
        valueChangeStatus: 0x01,
        ncAsmTotalEffect: 0x01,
        rest: hex(0x02, 0x00, 0x0a),
      });
    });

    it('parses a NTFY_PARAM the same way', () => {
      const status = decodeNcAsmParam(
        hex(Command.NcAsmNotifyParam, 0x02, 0x01, 0x00),
      );
      expect(status).toEqual({
        inquiredType: 0x02,
        valueChangeStatus: 0x01,
        ncAsmTotalEffect: 0x00,
        rest: hex(),
      });
    });

    it('returns null for unrelated command ids', () => {
      expect(
        decodeNcAsmParam(hex(Command.BatteryLevelReply, 0x01, 0x64, 0x00)),
      ).toBeNull();
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
