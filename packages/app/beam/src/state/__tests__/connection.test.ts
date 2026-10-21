/** Unit tests for the relay connection's lifecycle. */

import { createTestController } from '@lib/effects/testing';
import {
  $connected,
  $connectFailed,
  $connection,
  $relayChanged,
} from '../connection';

const RELAY = 'https://relay.example/';

describe('$connection', () => {
  it('ships already connecting', async () => {
    await using effects = createTestController();
    const connection = await effects.run($connection);

    expect(connection.status).toBe('connecting');
    expect(connection.homeRelay).toBeNull();
  });
});

describe('$connected', () => {
  it('marks the endpoint reachable', async () => {
    await using effects = createTestController();
    const connection = await effects.run($connection);
    const connected = await effects.run($connected);

    connected();

    expect(connection.status).toBe('connected');
  });
});

describe('$relayChanged', () => {
  it('records the relay carrying us', async () => {
    await using effects = createTestController();
    const connection = await effects.run($connection);
    const relayChanged = await effects.run($relayChanged);

    relayChanged(RELAY);

    expect(connection).toMatchObject({ status: 'connected', homeRelay: RELAY });
  });

  it('drops back to connecting when the relay goes away', async () => {
    await using effects = createTestController();
    const connection = await effects.run($connection);
    const relayChanged = await effects.run($relayChanged);

    relayChanged(RELAY);
    relayChanged(null);

    expect(connection).toMatchObject({ status: 'connecting', homeRelay: null });
  });

  it('is ignored once the connect has failed', async () => {
    await using effects = createTestController();
    const connection = await effects.run($connection);
    const relayChanged = await effects.run($relayChanged);
    const connectFailed = await effects.run($connectFailed);

    connectFailed();
    relayChanged(RELAY);

    expect(connection).toMatchObject({ status: 'failed', homeRelay: null });
  });
});

describe('$connectFailed', () => {
  it('fails the connection and forgets the relay', async () => {
    await using effects = createTestController();
    const connection = await effects.run($connection);
    const relayChanged = await effects.run($relayChanged);
    const connectFailed = await effects.run($connectFailed);

    relayChanged(RELAY);
    connectFailed();

    expect(connection).toMatchObject({ status: 'failed', homeRelay: null });
  });
});
