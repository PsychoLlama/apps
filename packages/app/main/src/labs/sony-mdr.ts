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

/**
 * First byte of a `Mdr` payload. The protocol's "command id". `Init*`
 * is canonically named `ConnectGet/RetProtocolInfo` in the original
 * sources, but everyone calls it the init handshake — we keep the
 * shorter name. Names of the rest match Sony's Sound Connect dump.
 */
export const Command = {
  InitRequest: 0x00,
  InitReply: 0x01,
  /** Returns the device feature list. Source of `FunctionType` codes. */
  SupportFunctionRequest: 0x06,
  SupportFunctionReply: 0x07,
  BatteryLevelRequest: 0x10,
  BatteryLevelReply: 0x11,
  BatteryLevelNotify: 0x12,
  /** Read live NC/ASM mode. Reply payload shape varies by inquiredType. */
  NcAsmGetParam: 0x66,
  NcAsmRetParam: 0x67,
  NcAsmSetParam: 0x68,
  NcAsmNotifyParam: 0x69,
} as const;

/**
 * Selects the NC/ASM payload shape. The XM4 uses the older
 * Plutoberth-era enum (`NoiseCancellingAndAmbientSoundMode = 0x02` for
 * combined NC+ASM control); the newer mos9527 enum's `0x11+` codes
 * are silently ignored by XM4 firmware.
 *
 * @see ~/projects/plutoberth/SonyHeadphonesClient/Client/Constants.h:44
 */
export const NcAsmInquiredType = {
  NoUse: 0x00,
  NoiseCancelling: 0x01,
  NoiseCancellingAndAmbientSoundMode: 0x02,
  AmbientSoundMode: 0x03,
} as const;

/**
 * Friendly label for a `Mdr` command id. Returns `null` for unknown
 * codes so callers can fall back to a hex display.
 */
export const commandName = (cmd: number): string | null => {
  for (const [name, code] of Object.entries(Command)) {
    if (code === cmd) return name;
  }
  return null;
};

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

/**
 * Decoded NC/ASM read. The first four bytes are the universal
 * `NcAsmParamBase` header; everything beyond `ncAsmTotalEffect` is
 * `inquiredType`-specific and surfaced as raw bytes for now since the
 * XM4's `NC_ON_OFF_AND_ASM_ON_OFF` shape isn't documented in
 * mos9527's transcription.
 */
export interface NcAsmStatus {
  inquiredType: number;
  /** `0`=under-changing, `1`=changed (settled). */
  valueChangeStatus: number;
  /** Whether either NC or ASM is currently producing an effect. */
  ncAsmTotalEffect: number;
  /** Trailing inquiredType-specific bytes. Decode once we have a real reply. */
  rest: Uint8Array;
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
 * Build a SUPPORT_FUNCTION (capability) query. `0x00` is the only
 * defined `inquiredType` (`FIXED_VALUE`). The reply lists feature codes
 * the device supports — see `decodeSupportFunctionReply`.
 */
export const encodeSupportFunctionRequest = (seq: number): Uint8Array =>
  encodeFrame({
    type: DataType.Mdr,
    seq,
    payload: new Uint8Array([Command.SupportFunctionRequest, 0x00]),
  });

/**
 * Build an NC/ASM read for a specific payload shape. The XM4 wants
 * `NcOnOffAndAsmOnOff` (0x11) per its support-function reply.
 */
export const encodeNcAsmGetParamRequest = (
  seq: number,
  inquiredType: number,
): Uint8Array =>
  encodeFrame({
    type: DataType.Mdr,
    seq,
    payload: new Uint8Array([Command.NcAsmGetParam, inquiredType]),
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
 * Pull the supported-function table out of a `SupportFunctionReply`
 * payload, or `null` if the payload isn't one. Layout:
 * `[0x07, 0x00, count, code₀, code₁, …]` — one byte per feature code.
 *
 * mos9527/SonyHeadphonesClient (transcribed from Sound Connect iOS
 * 12.2.0) describes a 2-byte `{code, priority}` entry, but the
 * WH-1000XM4 firmware predates the priority field and emits 1-byte
 * codes. mos9527's README explicitly excludes the XM4 from "legacy
 * support". Decode the older shape — newer Sony devices need a
 * separate path.
 */
export const decodeSupportFunctionReply = (
  payload: Uint8Array,
): number[] | null => {
  if (payload.length < 3) return null;
  if (payload[0] !== Command.SupportFunctionReply) return null;
  const count = payload[2];
  const expected = 3 + count;
  if (payload.length < expected) return null;
  return Array.from(payload.subarray(3, 3 + count));
};

/**
 * Friendly name for a `FunctionType` code from a `SupportFunctionReply`.
 * Returns `null` for unknown codes so callers can fall back to hex.
 */
export const functionTypeName = (code: number): string | null =>
  FUNCTION_TYPE_NAMES[code] ?? null;

/**
 * Pull an `NcAsmStatus` from a RET/NTFY param payload. Layout follows
 * `NcAsmParamBase`: `[cmd, inquiredType, valueChangeStatus,
 * ncAsmTotalEffect, …shape-specific]`. Returns `null` when the payload
 * isn't an NC/ASM reply.
 */
export const decodeNcAsmParam = (payload: Uint8Array): NcAsmStatus | null => {
  if (payload.length < 4) return null;
  const cmd = payload[0];
  const isParam =
    cmd === Command.NcAsmRetParam || cmd === Command.NcAsmNotifyParam;
  if (!isParam) return null;
  return {
    inquiredType: payload[1],
    valueChangeStatus: payload[2],
    ncAsmTotalEffect: payload[3],
    rest: Uint8Array.from(payload.subarray(4)),
  };
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

// `MessageMdrV2FunctionType_Table1`, transcribed from
// mos9527/SonyHeadphonesClient libmdr/include/mdr/ProtocolV2.hpp:21-152
// (extracted from Sound Connect iOS 12.2.0). XM4 returns Table 1 codes;
// Table 2 only kicks in if `ConnectRetProtocolInfo.supportTable2Value`
// is ENABLE, which the WH-1000XM4 doesn't set.
const FUNCTION_TYPE_NAMES: Record<number, string> = {
  0x10: 'CONCIERGE_DATA',
  0x11: 'CONNECTION_STATUS',
  0x12: 'CODEC_INDICATOR',
  0x13: 'UPSCALING_INDICATOR',
  0x14: 'BLE_SETUP',
  0x15: 'TUTORIAL_CONTENTS_SELECT_ON_CONCIERGE',
  0x16: 'CONNECTION_ESTABLISHED_TIME',
  0x17: 'UNNECESSARY_AUTO_RECONNECTION',
  0x18: 'DEVICE_SPECIAL_MODE',
  0x19: 'PHONE_AND_CONNECTED_DEVICE_INFOMATION_FOR_CLASSIC',
  0x1a: 'TANDEM_RECONNECTION_REQUEST',
  0x1b: 'DISPLAY_FW_VERSION',
  0x20: 'BATTERY_LEVEL_INDICATOR',
  0x21: 'LEFT_RIGHT_BATTERY_LEVEL_INDICATOR',
  0x22: 'CRADLE_BATTERY_LEVEL_INDICATOR',
  0x23: 'POWER_OFF',
  0x24: 'AUTO_POWER_OFF',
  0x25: 'AUTO_POWER_OFF_WITH_WEARING_DETECTION',
  0x26: 'POWER_SAVING_MODE_ON_OFF',
  0x27: 'TANDEM_KEEP_ALIVE',
  0x28: 'BATTERY_LEVEL_WITH_THRESHOLD',
  0x29: 'LR_BATTERY_LEVEL_WITH_THRESHOLD',
  0x2a: 'CRADLE_BATTERY_LEVEL_WITH_THRESHOLD',
  0x2b: 'BATTERY_SAFE_MODE',
  0x2c: 'CARING_CHARGE',
  0x2d: 'BT_STANDBY',
  0x2e: 'STAMINA',
  0x2f: 'AUTOMATIC_TOUCH_PANEL_BACKLIGHT_TURN_OFF',
  0x32: 'FW_UPDATE_MTK_TRANSFER_WITHOUT_DISCONNECTION',
  0x34: 'FW_UPDATE_MTK_TRANSFER_WITHOUT_DISCONNECTION_AUTO_UPDATE',
  0x35: 'FW_UPDATE_MTK_TRANSFER_WITH_REPAIR_MODE',
  0x36: 'FW_UPDATE_MTK_TRANSFER_WITH_AC_CONNECTION_CHECK',
  0x37: 'FW_UPDATE_TANDEM_TRANSFER_USING_COMMON_TABLE',
  0x38: 'FW_UPDATE_USING_MC_APP',
  0x40: 'TWS_SUPPORTS_A2DP_LEA_UNI_LEA_BROAD_WITH_CTKD',
  0x41: 'HBS_SUPPORTS_A2DP_LEA_UNI_LEA_BROAD_WITH_CTKD',
  0x42: 'CLASSIC_ONLY_LE_CLASSIC_SETTING',
  0x43: 'TWS_SUPPORTS_LEA_UNI_LEA_BROAD',
  0x44: 'CHANGE_TANDEM_CONNECTION_PROFILE_FOR_ANDROID',
  0x45: 'BGM_MODE_CANT_BE_USED_WITH_LEA_CONNECTION',
  0x46: 'HEAD_TRACKER_CANT_BE_USED_WITH_LEA_CONNECTION',
  0x47: 'PAIRING_DEVICE_MANAGEMENT_CANT_BE_USED_WITH_LEA_CONNECTION',
  0x48: 'SOUND_AR_CANT_BE_USED_WITH_LEA_CONNECTION',
  0x49: 'AUTO_PLAY_CANT_BE_USED_WITH_LEA_CONNECTION',
  0x4a: 'GATT_CONNECTABLE_CANT_BE_USED_WITH_LEA_CONNECTION',
  0x4b: 'SOUND_AR_OPTIMIZATION_CANT_BE_USED_WITH_LEA_CONNECTION',
  0x4c: 'QUICK_ACCESS_CANT_BE_USED_WITH_LEA_CONNECTION',
  0x4d: 'CONNECTION_MODE_CANT_BE_USED_WITH_LEA_CONNECTION',
  0x4e: 'VOICE_ASSISTANT_SETTINGS_CANT_BE_USED_WITH_LEA_CONNECTION',
  0x4f: 'VOICE_ASSISTANT_WAKE_WORD_CANT_BE_USED_WITH_LEA_CONNECTION',
  0x50: 'PRESET_EQ',
  0x51: 'EBB',
  0x52: 'PRESET_EQ_NON_CUSTOMIZABLE',
  0x53: 'PRESET_EQ_AND_ULT_MODE',
  0x54: 'SOUND_EFFECT',
  0x55: 'CUSTOM_EQ',
  0x56: 'TURN_KEY_EQ',
  0x57: 'PRESET_EQ_AND_ERRORCODE',
  0x61: 'NOISE_CANCELLING_ONOFF',
  0x62: 'NOISE_CANCELLING_ONOFF_AND_AMBIENT_SOUND_MODE_ONOFF',
  0x63: 'NOISE_CANCELLING_DUAL_SINGLE_OFF_AND_AMBIENT_SOUND_MODE_ONOFF',
  0x64: 'NOISE_CANCELLING_ONOFF_AND_AMBIENT_SOUND_MODE_LEVEL_ADJUSTMENT',
  0x65: 'NOISE_CANCELLING_DUAL_SINGLE_OFF_AMBIENT_SOUND_MODE_LEVEL_ADJUSTMENT',
  0x66: 'AMBIENT_SOUND_MODE_ONOFF',
  0x67: 'AMBIENT_SOUND_MODE_LEVEL_ADJUSTMENT',
  0x68: 'MODE_NC_ASM_NOISE_CANCELLING_DUAL_AUTO_AMBIENT_SOUND_MODE_LEVEL_ADJUSTMENT',
  0x69: 'AMBIENT_SOUND_CONTROL_MODE_SELECT',
  0x6a: 'MODE_NC_ASM_NOISE_CANCELLING_DUAL_SINGLE_AMBIENT_SOUND_MODE_LEVEL_ADJUSTMENT',
  0x6b: 'MODE_NC_ASM_NOISE_CANCELLING_DUAL_AMBIENT_SOUND_MODE_LEVEL_ADJUSTMENT',
  0x6c: 'MODE_NC_NCSS_ASM_NOISE_CANCELLING_DUAL_AMBIENT_SOUND_MODE_LEVEL_ADJUSTMENT_WITH_TEST_MODE',
  0x6d: 'MODE_NC_ASM_NOISE_CANCELLING_DUAL_AMBIENT_SOUND_MODE_LEVEL_ADJUSTMENT_NOISE_ADAPTATION',
  0x70: 'AUTO_NCASM',
  0x71: 'ADAPTIVE_CONTROL_WITH_PARAMETER_NOTIFICATION',
  0x80: 'NC_OPTIMIZER_PERSONAL_BAROMETRIC',
  0x81: 'NC_OPTIMIZER_PERSONAL',
  0x82: 'NC_OPTIMIZER_BAROMETRIC',
  0x83: 'SOUND_FIELD_OPTIMIZATION',
  0x84: 'TV_SOUND_BOOSTER',
  0x90: 'FIXED_MESSAGE',
  0x91: 'VIBRATOR_ALERT_NOTIFICATION',
  0x92: 'FIXED_MESSAGE_WITH_LR_SELECTION',
  0x93: 'VOICE_ASSISTANT_ALERT_NOTIFICATION',
  0x94: 'LE_AUDIO_ALERT_NOTIFICATION',
  0xa1: 'PLAYBACK_CONTROLLER_WITH_CALL_VOLUME_ADJUSTMENT',
  0xa2: 'PLAYBACK_CONTROLLER_WITH_CALL_VOLUME_ADJUSTMENT_AND_MUTE',
  0xa3: 'PLAYBACK_CONTROLLER_WITH_CALL_VOLUME_ADJUSTMENT_AND_FUNCTION_CHANGE',
  0xa4: 'PLAYBACK_CONTROLLER_WITH_FUNCTION_CHANGE',
  0xb0: 'SAR',
  0xb1: 'AUTO_PLAY',
  0xb2: 'GATT_CONNECTABLE',
  0xb3: 'SAR_OPTIMIZATION_COMPASS_ACCEL_TYPE',
  0xb5: 'HEAD_TRACKER_COMPASS_ACCEL_TYPE',
  0xb6: 'SAR_OPTIMIZATION_ACCEL_TYPE',
  0xb7: 'HEAD_TRACKER_ACCEL_TYPE',
  0xb8: 'INTEGRATED_AUTO_PLAY',
  0xc1: 'ACTION_LOG_NOTIFIER',
  0xc2: 'TIME_SERIES_OPERATIONLOG_NOTIFIER',
  0xc3: 'SOUND_DROPOUT_NOTIFIER',
  0xd1: 'GENERAL_SETTING_1',
  0xd2: 'GENERAL_SETTING_2',
  0xd3: 'GENERAL_SETTING_3',
  0xd4: 'GENERAL_SETTING_4',
  0xe1: 'CONNECTION_MODE_SOUND_QUALITY_CONNECTION_QUALITY',
  0xe2: 'UPSCALING_AUTO_OFF',
  0xe3: 'CONNECTION_MODE_SOUND_QUALITY_SOUND_WITH_LDAC_STATUS_QUALITY_CONNECTION_QUALITY',
  0xe4: 'BGM_MODE_SMALL_MIDDLE_LARGE',
  0xe5: 'UPMIX_CINEMA',
  0xe6: 'LISTENING_OPTION',
  0xe7: 'CONNECTION_MODE_CLASSIC_AUDIO_LE_AUDIO',
  0xe8: 'VOICE_CONTENTS',
  0xe9: 'SOUND_LEAKAGE_REDUCTION',
  0xea: 'LISTENING_OPTION_ASSIGN_CUSTOMIZABLE',
  0xeb: 'BGM_MODE_SMALL_MIDDLE_LARGE_AND_ERRORCODE',
  0xec: 'UPMIX_SERIES',
  0xf0: 'VIBRATOR_ON_OFF',
  0xf1: 'PLAYBACK_CONTROL_BY_WEARING_REMOVING_HEADPHONE_ON_OFF',
  0xf2: 'SMART_TALKING_MODE_TYPE1',
  0xf3: 'ASSIGNABLE_SETTING',
  0xf4: 'VOICE_ASSISTANT_SETTINGS',
  0xf5: 'VOICE_ASSISTANT_WAKE_WORD_ON_OFF',
  0xf6: 'WEARING_STATUS_DETECTOR',
  0xf7: 'EARPIECE_SELECTION',
  0xf8: 'CALL_SETTINGS',
  0xf9: 'RESET_SETTINGS',
  0xfa: 'AUTO_VOLUME',
  0xfb: 'FACE_TAP_TEST_MODE',
  0xfc: 'SMART_TALKING_MODE_TYPE2',
  0xfd: 'QUICK_ACCESS',
  0xfe: 'ASSIGNABLE_SETTING_WITH_LIMITATION',
  0xff: 'HEAD_GESTURE_ON_OFF_TRAINING',
};
