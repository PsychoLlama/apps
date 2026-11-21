import { defineCommand, defineStore } from '@lib/state';

/**
 * Where this device sits in coming up.
 *
 * - `opening` — the worker is starting, or the store is being opened.
 * - `open` — the database is open and usable, online or not.
 * - `elsewhere` — another tab has the device open. This one waits its turn
 *   and takes over when that tab closes.
 * - `failed` — the device couldn't be opened. Nothing retries.
 */
export type DeviceStatus = 'opening' | 'open' | 'elsewhere' | 'failed';

/** This device: whether it's open, who it is, and whether it's reachable. */
export interface DeviceState {
  /** How far opening the device has got. */
  status: DeviceStatus;

  /**
   * The device's address and identity, as a hex string, or `null` until
   * it's open.
   */
  id: string | null;

  /**
   * The relay carrying this device, or `null` while none is. A device
   * with no relay is offline: it reads and writes, and syncs later.
   */
  relay: string | null;

  /**
   * Whether a relay has carried this device since it opened. What tells
   * a device still finding its way online from one that was and isn't.
   */
  reached: boolean;
}

/**
 * How reachable this device is, as someone would say it.
 *
 * - `connecting` — coming up, or up and still looking for a relay.
 * - `online` — a relay is carrying it.
 * - `offline` — it was online and isn't. What's shared waits.
 */
export type Connection = 'connecting' | 'online' | 'offline';

/** This device's lifecycle and reachability. */
export const $device = defineStore<DeviceState>(() => ({
  status: 'opening',
  id: null,
  relay: null,
  reached: false,
}));

/**
 * How reachable the device is, or `null` when it isn't this tab's to
 * speak for: another tab has it, or it couldn't be opened.
 */
export const connectionOf = (device: {
  readonly status: DeviceStatus;
  readonly relay: string | null;
  readonly reached: boolean;
}): Connection | null => {
  if (device.status === 'opening') return 'connecting';
  if (device.status !== 'open') return null;
  if (device.relay !== null) return 'online';

  return device.reached ? 'offline' : 'connecting';
};

/** The device opened, under the identity its store holds. */
export const $deviceOpened = defineCommand(
  [$device],
  (device) => (id: string) => {
    device.status = 'open';
    device.id = id;
  },
);

/** Another tab holds the device. This one is waiting for it. */
export const $deviceHeldElsewhere = defineCommand([$device], (device) => () => {
  device.status = 'elsewhere';
});

/** The device couldn't be opened, or the thread running it died. */
export const $deviceFailed = defineCommand([$device], (device) => () => {
  device.status = 'failed';
  device.relay = null;
  device.reached = false;
});

/** The relay carrying this device changed, or went away. */
export const $relayChanged = defineCommand(
  [$device],
  (device) => (relay: string | null) => {
    device.relay = relay;
    if (relay !== null) device.reached = true;
  },
);
