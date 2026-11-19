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
}

/** This device's lifecycle and reachability. */
export const $device = defineStore<DeviceState>(() => ({
  status: 'opening',
  id: null,
  relay: null,
}));

/** Whether the device is open and a relay is carrying it. */
export const isOnline = (device: {
  readonly status: DeviceStatus;
  readonly relay: string | null;
}): boolean => device.status === 'open' && device.relay !== null;

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
});

/** The relay carrying this device changed, or went away. */
export const $relayChanged = defineCommand(
  [$device],
  (device) => (relay: string | null) => {
    device.relay = relay;
  },
);
