/** Unit tests for the device's lifecycle and reachability. */

import { createTestController } from '@lib/effects/testing';
import {
  $device,
  $deviceFailed,
  $deviceHeldElsewhere,
  $deviceOpened,
  $relayChanged,
  isOnline,
} from '../device';

const ID = 'a1b2c3d4e5f6';
const RELAY = 'https://relay.example/';

describe('$device', () => {
  it('starts out opening, with no identity and no relay', async () => {
    await using effects = createTestController();
    const device = await effects.run($device);

    expect(device).toEqual({ status: 'opening', id: null, relay: null });
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

describe('isOnline', () => {
  it('is true only while open with a relay', async () => {
    await using effects = createTestController();
    const device = await effects.run($device);
    const opened = await effects.run($deviceOpened);
    const relayChanged = await effects.run($relayChanged);

    // A relay can land before the open is announced.
    relayChanged(RELAY);
    expect(isOnline(device)).toBe(false);

    opened(ID);
    expect(isOnline(device)).toBe(true);

    relayChanged(null);
    expect(isOnline(device)).toBe(false);
  });
});
