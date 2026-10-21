import { createTestController } from '@lib/effects/testing';
import { saveContact } from '../../platform/database';
import { loadIdentity, sendMessage, startP2p } from '../../platform/iroh';
import { encodeBeamCode, type QrGrid } from '../../platform/qr-code';
import {
  $connection,
  $contacts,
  $identity,
  $peerLinks,
  $qrCode,
} from '../../state';
import { $connect } from '../connect';
import { PEER_ID, SELF_ID, fakeLink, fakeSession, flush } from './fixtures';

vi.mock('../../platform/database');
vi.mock('../../platform/qr-code');
vi.mock('../../platform/iroh', () => ({
  loadIdentity: vi.fn(),
  sendMessage: vi.fn(),
  startP2p: vi.fn(),
}));

const grid: QrGrid = { size: 1, modules: new Uint8Array([1]) };

const setup = () => {
  const session = fakeSession();
  vi.mocked(startP2p).mockResolvedValue(session);
  vi.mocked(loadIdentity).mockResolvedValue({
    endpointId: SELF_ID,
    secretKey: new Uint8Array(32),
  });

  return session;
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(sendMessage).mockResolvedValue(true);
  vi.mocked(encodeBeamCode).mockResolvedValue(grid);
});

describe('$connect', () => {
  it('settles the identity, encodes the invite, and joins', async () => {
    const session = setup();
    await using effects = createTestController();

    const connected = await effects.run($connect);
    const self = await effects.run($identity);
    const connection = await effects.run($connection);
    const code = await effects.run($qrCode);
    await flush();

    expect(connected?.p2p).toBe(session);
    expect(connected?.signal.aborted).toBe(false);
    expect(self.endpointId).toBe(SELF_ID);
    expect(encodeBeamCode).toHaveBeenCalledWith(SELF_ID);
    expect(code()).toBe(grid);
    expect(session.join).toHaveBeenCalled();
    expect(connection.status).toBe('connected');
  });

  it('lands as failed when the worker won’t start', async () => {
    vi.mocked(startP2p).mockRejectedValue(new Error('no wasm'));
    await using effects = createTestController();

    const connected = await effects.run($connect);
    const connection = await effects.run($connection);

    expect(connected).toBeNull();
    expect(connection.status).toBe('failed');
  });

  it('lands as failed when the join does, and still releases the session', async () => {
    const session = setup();
    session.join.mockRejectedValue(new Error('no relay'));
    const effects = createTestController();

    const connected = await effects.run($connect);
    const connection = await effects.run($connection);
    const self = await effects.run($identity);

    expect(connected).toBeNull();
    expect(connection.status).toBe('failed');
    expect(self.endpointId).toBe(SELF_ID);

    await effects[Symbol.asyncDispose]();
    expect(session.release).toHaveBeenCalled();
  });

  it('reports relay changes', async () => {
    const session = setup();
    await using effects = createTestController();
    await effects.run($connect);
    const connection = await effects.run($connection);

    session.relay.push(null);
    await flush();
    expect(connection).toEqual({ status: 'connecting', homeRelay: null });

    session.relay.push('https://relay.example');
    await flush();
    expect(connection).toEqual({
      status: 'connected',
      homeRelay: 'https://relay.example',
    });
  });

  it('greets inbound peers', async () => {
    const session = setup();
    await using effects = createTestController();
    await effects.run($connect);
    const book = await effects.run($contacts);
    const links = await effects.run($peerLinks);

    session.peers.push(fakeLink());
    await flush();

    expect(book.entries[PEER_ID]).toBeDefined();
    expect(saveContact).toHaveBeenCalled();
    expect(links.statuses[PEER_ID]).toBe('linked');
  });

  it('ends its loops and releases the session when let go', async () => {
    const session = setup();
    const effects = createTestController();
    const connected = await effects.run($connect);
    const book = await effects.run($contacts);

    await effects[Symbol.asyncDispose]();
    session.peers.push(fakeLink());
    await flush();

    expect(connected?.signal.aborted).toBe(true);
    expect(session.release).toHaveBeenCalled();
    expect(book.entries).toEqual({});
  });
});
