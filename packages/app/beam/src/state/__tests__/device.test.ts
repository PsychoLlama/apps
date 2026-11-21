/** Unit tests for the device's lifecycle and reachability. */

import { createTestController } from '@lib/effects/testing';
import {
  $device,
  $deviceFailed,
  $deviceHeldElsewhere,
  $deviceOpened,
  $relayChanged,
  connectionOf,
} from '../device';

const ID = 'a1b2c3d4e5f6';
const RELAY = 'https://relay.example/';

describe('$device', () => {
  it('starts out opening, with no identity and no relay', async () => {
    await using effects = createTestController();
    const device = await effects.run($device);

    expect(device).toEqual({
      status: 'opening',
      id: null,
      relay: null,
      reached: false,
    });
  });
});

describe('$deviceOpened', () => {
  it('records the identity the device opened under', async () => {
    await using effects = createTestController();
    const device = await effects.run($device);
    const opened = await effects.run($deviceOpened);

    opened(ID);

    expect(device).toMatchObject({ status: 'open', id: ID });
  });

  it('takes over from a wait on another tab', async () => {
    await using effects = createTestController();
    const device = await effects.run($device);
    const heldElsewhere = await effects.run($deviceHeldElsewhere);
    const opened = await effects.run($deviceOpened);

    heldElsewhere();
    expect(device.status).toBe('elsewhere');

    opened(ID);
    expect(device.status).toBe('open');
  });
});

describe('$deviceFailed', () => {
  it('fails the device and forgets the relay', async () => {
    await using effects = createTestController();
    const device = await effects.run($device);
    const opened = await effects.run($deviceOpened);
    const relayChanged = await effects.run($relayChanged);
    const failed = await effects.run($deviceFailed);

    opened(ID);
    relayChanged(RELAY);
    failed();

    expect(device).toMatchObject({ status: 'failed', relay: null });
  });
});

describe('connectionOf', () => {
  it('is connecting until a relay carries the open device', async () => {
    await using effects = createTestController();
    const device = await effects.run($device);
    const opened = await effects.run($deviceOpened);
    const relayChanged = await effects.run($relayChanged);

    expect(connectionOf(device)).toBe('connecting');

    // The watcher reports having no relay before it reports having one.
    opened(ID);
    relayChanged(null);
    expect(connectionOf(device)).toBe('connecting');

    relayChanged(RELAY);
    expect(connectionOf(device)).toBe('online');
  });

  it('is offline once a relay it had is gone, and online when one is back', async () => {
    await using effects = createTestController();
    const device = await effects.run($device);
    const opened = await effects.run($deviceOpened);
    const relayChanged = await effects.run($relayChanged);

    opened(ID);
    relayChanged(RELAY);
    relayChanged(null);
    expect(connectionOf(device)).toBe('offline');

    relayChanged(RELAY);
    expect(connectionOf(device)).toBe('online');
  });

  it('has nothing to say for a device this tab does not have', async () => {
    await using effects = createTestController();
    const device = await effects.run($device);
    const heldElsewhere = await effects.run($deviceHeldElsewhere);
    const failed = await effects.run($deviceFailed);

    heldElsewhere();
    expect(connectionOf(device)).toBeNull();

    failed();
    expect(connectionOf(device)).toBeNull();
  });
});
